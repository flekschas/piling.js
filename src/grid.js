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

  return {
    colNum,
    rowNum,
    colWidth,
    rowHeight,
    cellRatio
  };
};

export default createGrid;
