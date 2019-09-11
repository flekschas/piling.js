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
