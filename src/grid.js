/**
 * Factory function to create a grid
 * @param {object} canvas - The canvas instance
 * @param {number} cols - The number of column
 * @param {number} rows - The number of row
 * @param {number} rowHeight - The height of row
 * @param {number} cellRatio - The ratio of cell height and width
 */
const createGrid = (canvas, [cols, rows, rowHeight, cellRatio]) => {
  const { width } = canvas.getBoundingClientRect();

  const myColNum = cols;
  let myRowNum;
  const myColWidth = width / cols;
  let myRowHeight;
  let myCellRatio; // height = ratio * width

  if (!+rows && !+rowHeight && !+cellRatio) {
    myCellRatio = 1;
    myRowHeight = myColWidth;
  } else if (+cellRatio) {
    myCellRatio = cellRatio;
    myRowHeight = myCellRatio * myColWidth;
  } else if (+rowHeight) {
    if (!myRowHeight) myRowHeight = rowHeight;
  } else if (+rows) {
    if (!myRowHeight) {
      myRowNum = rows;
      myRowHeight = myColWidth;
    }
  }

  return {
    myColNum,
    myRowNum,
    myColWidth,
    myRowHeight,
    myCellRatio
  };
};

export default createGrid;
