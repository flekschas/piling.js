import clip from 'liang-barsky';

import { l1Dist, l2Norm, normalizeVector } from './utils';

/**
 * Factory function to create a grid
 * @param {object} canvas - The canvas instance
 * @param {number} itemSize - The maximum length of either side of an item
 * @param {number} columns - The number of column
 * @param {number} rowHeight - The height of row
 * @param {number} cellAspectRatio - The ratio of cell height and width
 * @param {number} cellPadding - The padding between items
 */
const createGrid = (
  canvas,
  {
    itemSize = null,
    columns = 10,
    rowHeight = null,
    cellAspectRatio = 1,
    pileCellAlignment = 'topLeft',
    cellPadding = 0
  } = {}
) => {
  const { width } = canvas.getBoundingClientRect();

  let numColumns = columns;
  let numRows;
  let columnWidth = width / columns;
  let cellWidth = columnWidth - cellPadding * 2;
  let cellHeight = null;

  if (+itemSize) {
    columnWidth = itemSize + cellPadding * 2;
    numColumns = Math.floor(width / columnWidth);
    cellWidth = itemSize;
  }

  if (!+rowHeight) {
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

  /**
   * Convert an i,j cell position to a linear index
   * @param   {number}  i  Position on the x-axis
   * @param   {number}  j  Position on the y-axis
   * @return  {number}  Index of the i,j-th cell
   */
  const ijToIdx = (i, j) => j * numColumns + i;

  /**
   * Convert an index to the i,j cell position
   * @param   {number}  idx  Index of a cell
   * @return  {array}  Tuple with the i,j cell position
   */
  const idxToIj = idx => [idx % numColumns, Math.floor(idx / numColumns)];

  /**
   * Convert the i,j cell position to an x,y pixel position
   * @param   {number}  i  Position of the cell on the x-axis
   * @param   {number}  j  Position of the cell on the y-axis
   * @param   {number}  width  Width of the pile to be positioned
   * @param   {number}  height  Height of the pile to be positioned
   * @return  {array}  Tuple representing the x,y position
   */
  const ijToXy = (i, j, pileWidth, pileHeight) => {
    if (!pileWidth || !pileHeight) {
      return [i * cellWidth, j * cellHeight];
    }

    const topLeft = [
      i * columnWidth + cellPadding,
      j * rowHeight + cellPadding
    ];

    switch (pileCellAlignment) {
      case 'topRight':
        return [topLeft[0] + cellWidth - pileWidth, topLeft[1]];

      case 'bottomLeft':
        return [topLeft[0], topLeft[1] + cellHeight - pileHeight];

      case 'bottomRight':
        return [
          topLeft[0] + cellWidth - pileWidth,
          topLeft[1] + cellHeight - pileHeight
        ];

      case 'center':
        return [
          topLeft[0] + (cellWidth - pileWidth) / 2,
          topLeft[1] + (cellHeight - pileHeight) / 2
        ];

      case 'topLeft':
      default:
        return topLeft;
    }
  };

  const align = piles => {
    const cells = [];
    const conflicts = [];
    const pilePositions = new Map();
    piles.forEach(pile => {
      pilePositions.set(pile.id, {
        id: pile.id,
        cX: pile.cX,
        cY: pile.cY,
        width: pile.graphics.width,
        height: pile.graphics.height
      });
    });

    const assignPileToCell = pile => {
      const i = Math.floor(pile.cX / columnWidth);
      const j = Math.floor(pile.cY / rowHeight);
      const idx = ijToIdx(i, j);

      if (!cells[idx]) cells[idx] = new Set();

      if (cells[idx].size === 1) {
        conflicts.push(idx);
      }

      cells[idx].add(pile.id);

      return [i, j];
    };

    // 1. We assign every pile to its closest cell
    pilePositions.forEach(pile => {
      const [i, j] = assignPileToCell(pile);
      pilePositions.set(pile.id, { ...pile, i, j });
    });

    // 2. Resolve conflicts
    while (conflicts.length) {
      const idx = conflicts.shift();
      const anchor = ijToXy(...idxToIj(idx));
      anchor[0] += columnWidthHalf;
      anchor[1] += rowHeightHalf;
      const cellRect = [
        anchor[0] - columnWidthHalf,
        anchor[1] - rowHeightHalf,
        anchor[0] + columnWidthHalf,
        anchor[1] + rowHeightHalf
      ];

      const conflictingPiles = new Set(cells[idx]);

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
      let x = a => a;
      let y = a => a;
      if (isTopBlocked) {
        anchor[1] -= rowHeightHalf;
        y = a => Math.max(0, a);
      }
      if (isLeftBlocked) {
        anchor[0] -= columnWidthHalf;
        x = a => Math.max(0, a);
      }
      if (isRightBlocked) {
        anchor[0] += columnWidthHalf;
        x = isLeftBlocked ? () => 0 : a => Math.min(0, a);
      }
      if (isLeftBlocked && isRightBlocked) {
        // To avoid no movement at all we enforce a downward direction
        y = () => (isTopBlocked ? 1 : -1);
      }

      // 2b. Find the pile that is closest to the anchor
      let d = Infinity;
      let closestPile;
      conflictingPiles.forEach(pileId => {
        const pile = pilePositions.get(pileId);
        const newD = l1Dist(pile.cX, pile.cY, ...anchor);
        if (newD < d) {
          closestPile = pileId;
          d = newD;
        }
      });

      // 2c. Remove the cell assignment of conflicting piles
      conflictingPiles.forEach(pileId => {
        if (pileId === closestPile) return;

        // Remove pile from cell
        cells[idx].delete(pileId);
      });

      // 2d. Move all piles except for the closest pile to other cells
      conflictingPiles.forEach(pileId => {
        if (pileId === closestPile) return;

        const pile = pilePositions.get(pileId);

        // Move piles in direction from the closest via themselves
        let direction = [
          pile.cX - pilePositions.get(closestPile).cX,
          pile.cY - pilePositions.get(closestPile).cY
        ];
        direction[0] += (Math.sign(direction[0]) || 1) * Math.random();
        direction[1] += (Math.sign(direction[1]) || 1) * Math.random();
        direction = normalizeVector([x(direction[0]), y(direction[1])]);

        // Move the pile in direction `direction` to the cell border
        // We accomplish this by clipping a line starting at the pile
        // position that goes outside the cell.
        const outerPoint = [
          pile.cX + cellDiameterWithPadding * direction[0],
          pile.cY + cellDiameterWithPadding * direction[1]
        ];
        const borderPoint = [...outerPoint];

        clip([pile.cX, pile.cY], borderPoint, cellRect);

        // To avoid that the pile is moved back to the same pile we move it a
        // little bit further
        borderPoint[0] += Math.sign(direction[0]) * 0.1;
        borderPoint[1] += Math.sign(direction[1]) * 0.1;

        // "Move" pile to the outerPoint, which is now the borderPoint
        pile.cX = borderPoint[0];
        pile.cY = borderPoint[1];

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
        pilePositions.get(id).height
      );
      return { id, x, y };
    });
  };

  return {
    // Properties
    get itemSize() {
      return itemSize;
    },
    get numColumns() {
      return numColumns;
    },
    get numRows() {
      return numRows;
    },
    set numRows(newNumRows) {
      if (!Number.isNaN(+newNumRows)) numRows = newNumRows;
    },
    get columnWidth() {
      return columnWidth;
    },
    get rowHeight() {
      return rowHeight;
    },
    get cellWidth() {
      return cellWidth;
    },
    get cellHeight() {
      return cellHeight;
    },
    get cellAspectRatio() {
      return cellAspectRatio;
    },
    get cellPadding() {
      return cellPadding;
    },
    // Methods
    align,
    ijToXy
  };
};

export default createGrid;
