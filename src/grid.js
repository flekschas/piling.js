const createGrid = (canvas, [cols, rows, rowHeight, cellRatio]) => {
  const { width, height } = canvas.getBoundingClientRect();

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
      myRowHeight = height / rows;
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
