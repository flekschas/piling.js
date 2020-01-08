import clip from 'liang-barsky';

import { l1Dist, l2Norm, normalizeVector } from './utils';

/**
 * Factory function to create a grid
 * @param {object} canvas - The canvas instance
 * @param {number} cols - The number of column
 * @param {number} rows - The number of row
 * @param {number} rowHeight - The height of row
 * @param {number} cellRatio - The ratio of cell height and width
 */
const createGrid = (canvas, [cols, rows, newRowHeight, newCellRatio]) => {
  const { width } = canvas.getBoundingClientRect();

  const colNum = cols;
  let rowNum = 0;
  const colWidth = width / cols;
  let rowHeight;
  let cellRatio; // height = ratio * width

  if (!+rows && !+rowHeight && !+cellRatio) {
    cellRatio = 1;
    rowHeight = colWidth;
  } else if (+cellRatio) {
    cellRatio = newCellRatio;
    rowHeight = cellRatio * colWidth;
  } else if (+rowHeight) {
    if (!rowHeight) rowHeight = newRowHeight;
  } else if (+rows) {
    if (!rowHeight) {
      rowNum = rows;
      rowHeight = colWidth;
    }
  }

  const cellWidthHalf = colWidth / 2;
  const cellHeightHalf = rowHeight / 2;
  const cellDiameter = l2Norm([colWidth, rowHeight]);

  const ijToIdx = (i, j) => j * colNum + i;

  const idxToIj = idx => [idx % colNum, Math.floor(idx / colNum)];

  const ijToXy = (i, j) => [i * colWidth, j * rowHeight];

  const align = piles => {
    const cells = [];
    const conflicts = [];
    const pilePositions = new Map();
    piles.forEach(pile => {
      pilePositions.set(pile.id, {
        id: pile.id,
        cX: pile.cX,
        cY: pile.cY
      });
    });

    const assignPileToCell = pile => {
      const i = Math.floor(pile.cX / colWidth);
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
      anchor[0] += cellWidthHalf;
      anchor[1] += cellHeightHalf;
      const cellRect = [
        anchor[0] - cellWidthHalf,
        anchor[1] - cellHeightHalf,
        anchor[0] + cellWidthHalf,
        anchor[1] + cellHeightHalf
      ];

      const conflictingPiles = new Set(cells[idx]);

      // 2a. Determine anchor point. For that we check if the top, left, or right
      // cell is empty
      const topIdx = idx - colNum;
      const isTopBlocked = topIdx < 0 || (cells[topIdx] && cells[topIdx].size);
      const leftIdx = idx - 1;
      const isLeftBlocked =
        leftIdx < 0 ||
        idx % colNum === 0 ||
        (cells[leftIdx] && cells[leftIdx].size);
      const rightIdx = idx + 1;
      const isRightBlocked =
        rightIdx % colNum === 0 || (cells[rightIdx] && cells[rightIdx].size);
      let x = a => a;
      let y = a => a;
      if (isTopBlocked) {
        anchor[1] -= cellHeightHalf;
        y = a => Math.max(0, a);
      }
      if (isLeftBlocked) {
        anchor[0] -= cellWidthHalf;
        x = a => Math.max(0, a);
      }
      if (isRightBlocked) {
        anchor[0] += cellWidthHalf;
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
        const pile = piles.get(pileId);
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
          pile.cX + cellDiameter * direction[0],
          pile.cY + cellDiameter * direction[1]
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
      const [x, y] = ijToXy(i, j);
      return { id, x, y };
    });
  };

  return {
    align,
    colNum,
    rowNum,
    colWidth,
    rowHeight,
    cellRatio
  };
};

export default createGrid;
