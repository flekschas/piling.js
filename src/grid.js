const ndarray = require('ndarray');

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

  const mat = ndarray(new Uint16Array(myColNum * myRowNum), [
    myRowNum,
    myColNum
  ]);

  for (let i = 0; i < mat.shape[0]; i++) {
    for (let j = 0; j < mat.shape[1]; j++) {
      mat.set(i, j, 0);
    }
  }

  return {
    myColNum,
    myRowNum,
    myColWidth,
    myRowHeight,
    myCellRatio,
    mat
  };
};

export default createGrid;
