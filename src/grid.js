import { l1PointDist, l2Norm, normalize } from '@flekschas/utils';
import clip from 'liang-barsky';

/**
 * Factory function to create a grid
 * @param {object} canvas - The canvas instance
 * @param {number} cellSize - The size of the cell
 * @param {number} columns - The number of column
 * @param {number} rowHeight - The height of row
 * @param {number} cellAspectRatio - The ratio of cell height and width
 * @param {number} cellPadding - The padding between items
 */
const createGrid = (
  { width, height, orderer },
  {
    cellSize = null,
    columns = 10,
    rowHeight = null,
    cellAspectRatio = 1,
    pileCellAlignment = 'topLeft',
    cellPadding = 0,
  } = {}
) => {
  let numColumns = columns;

  if (!+cellSize && !+columns) {
    numColumns = 10;
  }

  let columnWidth = width / numColumns;
  let cellWidth = columnWidth - cellPadding * 2;
  let cellHeight = null;

  if (+cellSize) {
    columnWidth = cellSize + cellPadding * 2;
    numColumns = Math.floor(width / columnWidth);
    cellWidth = cellSize;
  }

  if (!+rowHeight) {
    if (!+cellAspectRatio) {
      // eslint-disable-next-line no-param-reassign
      cellAspectRatio = 1;
    }
    // eslint-disable-next-line no-param-reassign
    rowHeight = columnWidth / cellAspectRatio;
  } else {
    // eslint-disable-next-line no-param-reassign
    cellAspectRatio = columnWidth / rowHeight;
  }

  cellHeight = rowHeight - cellPadding * 2;

  const columnWidthHalf = columnWidth / 2;
  const rowHeightHalf = rowHeight / 2;
  const cellDiameterWithPadding = l2Norm([columnWidthHalf, rowHeightHalf]);

  let numRows = Math.ceil(height / rowHeight);

  /**
   * Convert an i,j cell position to a linear index
   * @param   {number}  i  Row number
   * @param   {number}  j  Column number
   * @return  {number}  Index of the i,j-th cell
   */
  const ijToIdx = (i, j) => i * numColumns + j;

  /**
   * Convert an index to the i,j cell position
   * @param   {number}  idx  Index of a cell
   * @return  {array}  Tuple with the i,j cell position
   */
  const idxToIj = orderer(numColumns);

  /**
   * Convert XY to IJ position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @return {array} Tuple with rowNumber and column number, i.e., [i,j]
   */
  const xyToIj = (x, y) => [
    Math.floor(y / rowHeight),
    Math.floor(x / columnWidth),
  ];

  /**
   * Convert the i,j cell position to an x,y pixel position
   * @param   {number}  i  Row number
   * @param   {number}  j  Column number
   * @param   {number}  width  Width of the pile to be positioned
   * @param   {number}  height  Height of the pile to be positioned
   * @return  {array}  Tuple representing the x,y position
   */
  const ijToXy = (i, j, pileWidth, pileHeight, pileOffset) => {
    let top = i * rowHeight + cellPadding;
    let left = j * columnWidth + cellPadding;

    if (!pileWidth || !pileHeight) {
      return [left, top];
    }

    // Elements are positioned
    left += pileOffset[0];
    top += pileOffset[1];

    switch (pileCellAlignment) {
      case 'topRight':
        return [left + cellWidth - pileWidth, top];

      case 'bottomLeft':
        return [left, top + cellHeight - pileHeight];

      case 'bottomRight':
        return [left + cellWidth - pileWidth, top + cellHeight - pileHeight];

      case 'center':
        return [
          left + (cellWidth - pileWidth) / 2,
          top + (cellHeight - pileHeight) / 2,
        ];

      case 'topLeft':
      default:
        return [left, top];
    }
  };

  const idxToXy = (index, pileWidth, pileHeight, pileOffset) =>
    ijToXy(...idxToIj(index), pileWidth, pileHeight, pileOffset);

  /**
   * Convert the u,v position to an x,y pixel position
   * @param   {number}  u  Relative position of the canvas on the x-axis
   * @param   {number}  v  Relative position of the canvas on the y-axis
   * @return  {array}  Tuple representing the x,y position
   */
  const uvToXy = (u, v) => [u * width, v * height];

  const getPilePosByCellAlignment = (pile) => {
    let refX = 'minX';
    let refY = 'minY';

    switch (pileCellAlignment) {
      case 'topRight':
        refX = 'maxX';
        break;

      case 'bottomLeft':
        refY = 'maxY';
        break;

      case 'bottomRight':
        refX = 'maxX';
        refY = 'maxY';
        break;

      case 'center':
        refX = 'cX';
        refY = 'cY';
        break;

      default:
        // Already set
        break;
    }

    return [pile.anchorBox[refX], pile.anchorBox[refY]];
  };

  const align = (piles) => {
    const cells = [];
    const conflicts = [];
    const pilePositions = new Map();

    piles.forEach((pile) => {
      const [x, y] = getPilePosByCellAlignment(pile);
      pilePositions.set(pile.id, {
        id: pile.id,
        ...pile.anchorBox,
        x,
        y,
        offset: pile.offset,
      });
    });

    const assignPileToCell = (pile) => {
      // The +1 and -1 are to avoid floating point precision-related glitches
      const i1 = (pile.minY + 1) / rowHeight;
      const j1 = (pile.minX + 1) / columnWidth;
      const i2 = (pile.maxY - 1) / rowHeight;
      const j2 = (pile.maxX - 1) / columnWidth;

      let i;
      let j;

      switch (pileCellAlignment) {
        case 'topRight':
          j = Math.floor(j2);
          break;

        case 'bottomLeft':
          i = Math.floor(i2);
          break;

        case 'bottomRight':
          i = Math.floor(i2);
          j = Math.floor(j2);
          break;

        case 'center':
          i = Math.floor(i1 + (i2 - i1) / 2);
          j = Math.floor(j1 + (j2 - j1) / 2);
          break;

        case 'topLeft':
        default:
          i = Math.floor(i1);
          j = Math.floor(j1);
          break;
      }

      const idx = ijToIdx(i, j);

      if (!cells[idx]) cells[idx] = new Set();

      if (cells[idx].size === 1) {
        conflicts.push(idx);
      }

      cells[idx].add(pile.id);

      return [i, j];
    };

    // 1. We assign every pile to its closest cell
    pilePositions.forEach((pile) => {
      const [i, j] = assignPileToCell(pile);
      pilePositions.set(pile.id, { ...pile, i, j });
    });

    // 2. Resolve conflicts
    while (conflicts.length) {
      const idx = conflicts.shift();
      const anchor = ijToXy(...idxToIj(idx));

      const cellRect = [
        anchor[0],
        anchor[1],
        anchor[0] + columnWidth,
        anchor[1] + rowHeight,
      ];

      anchor[0] += columnWidthHalf;
      anchor[1] += rowHeightHalf;

      const conflictingPiles = new Set(cells[idx]);

      let dist = l1PointDist;

      // 2a. Determine anchor point. For that we check if the top, left, or right
      // cell is empty
      const topIdx = idx - numColumns;
      const isTopBlocked = topIdx < 0 || (cells[topIdx] && cells[topIdx].size);
      const leftIdx = idx - 1;
      const isLeftBlocked =
        leftIdx < 0 ||
        idx % numColumns === 0 ||
        (cells[leftIdx] && cells[leftIdx].size);
      const rightIdx = idx + 1;
      const isRightBlocked =
        rightIdx % numColumns === 0 ||
        (cells[rightIdx] && cells[rightIdx].size);
      let x = (a) => a;
      let y = (a) => a;
      if (isTopBlocked) {
        anchor[1] -= rowHeightHalf;
        y = (a) => Math.max(0, a);
      }
      if (isLeftBlocked) {
        anchor[0] -= columnWidthHalf;
        x = (a) => Math.max(0, a);
      }
      if (isRightBlocked) {
        anchor[0] += columnWidthHalf;
        x = isLeftBlocked ? () => 0 : (a) => Math.min(0, a);
      }
      if (isLeftBlocked && isRightBlocked) {
        // To avoid no movement at all we enforce a up- or downward direction
        y = () => (isTopBlocked ? 1 : -1);

        // Only the vertical distance should count now
        if (isTopBlocked) dist = (x1, y1, x2, y2) => Math.abs(y1 - y2);
      }
      if (isTopBlocked && isLeftBlocked && isRightBlocked) {
        // To avoid no movement at all we enforce a up- or downward direction
        y = () => (isTopBlocked ? 1 : -1);
      }

      // 2b. Find the pile that is closest to the anchor
      let d = Infinity;
      let closestPile;
      conflictingPiles.forEach((pileId) => {
        const pile = pilePositions.get(pileId);
        const newD = dist(pile.x, pile.y, anchor[0], anchor[1]);
        if (newD < d) {
          closestPile = pileId;
          d = newD;
        }
      });

      // 2c. Remove the cell assignment of conflicting piles
      conflictingPiles.forEach((pileId) => {
        if (pileId === closestPile) return;

        // Remove pile from cell
        cells[idx].delete(pileId);
      });

      // 2d. Move all piles except for the closest pile to other cells
      conflictingPiles.forEach((pileId) => {
        if (pileId === closestPile) return;

        const pile = pilePositions.get(pileId);

        // Move piles in direction from the closest via themselves
        let direction = [
          pile.x - pilePositions.get(closestPile).x,
          pile.y - pilePositions.get(closestPile).y,
        ];
        direction[0] += (Math.sign(direction[0]) || 1) * Math.random();
        direction[1] += (Math.sign(direction[1]) || 1) * Math.random();
        direction = normalize([x(direction[0]), y(direction[1])]);

        // Move the pile in direction `direction` to the cell border
        // We accomplish this by clipping a line starting at the pile
        // position that goes outside the cell.
        const outerPoint = [
          pile.x + cellDiameterWithPadding * direction[0],
          pile.y + cellDiameterWithPadding * direction[1],
        ];
        const borderPoint = [...outerPoint];

        clip([pile.x, pile.y], borderPoint, cellRect);

        // To avoid that the pile is moved back to the same pile we move it a
        // little bit further
        borderPoint[0] += Math.sign(direction[0]) * 0.1;
        borderPoint[1] += Math.sign(direction[1]) * 0.1;

        // "Move" pile to the outerPoint, which is now the borderPoint
        const dX = borderPoint[0] - pile.x;
        const dY = borderPoint[1] - pile.y;
        pile.minX += dX;
        pile.minY += dY;
        pile.maxX += dX;
        pile.maxY += dY;
        pile.cX += dX;
        pile.cY += dY;
        pile.x += dX;
        pile.y += dY;

        // Assign the pile to a new cell
        const [i, j] = assignPileToCell(pile);

        pilePositions.set(pileId, { ...pile, i, j });
      });
    }

    return Array.from(pilePositions.entries(), ([id, { i, j }]) => {
      const [x, y] = ijToXy(
        i,
        j,
        pilePositions.get(id).width,
        pilePositions.get(id).height,
        pilePositions.get(id).offset
      );
      return { id, x, y };
    });
  };

  return {
    // Properties
    get numRows() {
      return numRows;
    },
    set numRows(newNumRows) {
      if (!Number.isNaN(+newNumRows)) numRows = newNumRows;
    },
    numColumns,
    columnWidth,
    rowHeight,
    cellWidth,
    cellHeight,
    cellAspectRatio,
    cellPadding,
    width,
    height,
    // Methods
    align,
    getPilePosByCellAlignment,
    ijToXy,
    ijToIdx,
    idxToIj,
    idxToXy,
    uvToXy,
    xyToIj,
  };
};

export default createGrid;
