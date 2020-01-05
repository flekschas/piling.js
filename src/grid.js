/**
 * Factory function to create a grid
 * @param {object} canvas - The canvas instance
 * @param {number} itemSize - The maximum length of either side of an item
 * @param {number} columns - The number of column
 * @param {number} rows - The number of row
 * @param {number} rowHeight - The height of row
 * @param {number} cellAspectRatio - The ratio of cell height and width
 * @param {number} itemPadding - The padding between items
 */
const createGrid = (
  canvas,
  {
    itemSize = null,
    columns = 10,
    rows = null,
    rowHeight = null,
    cellAspectRatio = 1,
    itemPadding = 0
  } = {}
) => {
  const { width } = canvas.getBoundingClientRect();

  let colNum = columns;
  let rowNum = 0;
  let colWidth = width / columns;

  if (+itemSize) {
    colNum = Math.floor(width / itemSize);
    colWidth = itemSize;
  }

  if (!+rowHeight) {
    // eslint-disable-next-line no-param-reassign
    rowHeight = colWidth / cellAspectRatio;
  }
  if (+rows) {
    rowNum = rows;
  }

  return {
    itemSize,
    colNum,
    rowNum,
    colWidth,
    rowHeight,
    cellAspectRatio,
    itemPadding
  };
};

export default createGrid;
