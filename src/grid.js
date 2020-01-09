/**
 * Factory function to create a grid
 * @param {object} canvas - The canvas instance
 * @param {number} itemSize - The maximum length of either side of an item
 * @param {number} columns - The number of column
 * @param {number} rowHeight - The height of row
 * @param {number} cellAspectRatio - The ratio of cell height and width
 * @param {number} itemPadding - The padding between items
 */
const createGrid = (
  canvas,
  {
    itemSize = null,
    columns = 10,
    rowHeight = null,
    cellAspectRatio = 1,
    itemPadding = 0
  } = {}
) => {
  const { width } = canvas.getBoundingClientRect();

  let colNum = columns;
  let rowNum;
  let cellWidth = width / columns;
  let colWidth = cellWidth - itemPadding * 2;
  let cellHeight = null;

  if (+itemSize) {
    cellWidth = itemSize + itemPadding * 2;
    colNum = Math.floor(width / cellWidth);
    colWidth = itemSize;
  }

  if (!+rowHeight) {
    // eslint-disable-next-line no-param-reassign
    rowHeight = colWidth / cellAspectRatio;
  } else {
    // eslint-disable-next-line no-param-reassign
    cellAspectRatio = colWidth / rowHeight;
  }

  cellHeight = rowHeight + itemPadding * 2;

  return {
    itemSize,
    colNum,
    rowNum,
    colWidth,
    rowHeight,
    cellWidth,
    cellHeight,
    cellAspectRatio,
    itemPadding
  };
};

export default createGrid;
