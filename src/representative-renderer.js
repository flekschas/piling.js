import * as PIXI from 'pixi.js';

/**
 * [description]
 * @param {number} n - Number of items
 * @return {array} Triple of number of rows, number of columns, aspectRatio
 */
const getRegularGrid = n => {
  switch (n) {
    case 1:
      return [1, 1, 1];

    case 2:
      return [1, 2, 1.5];

    case 3:
      return [1, 3, 2];

    case 4:
    case 5:
      return [2, 2, 1];

    case 6:
    case 7:
      return [2, 3, 1.5];

    case 8:
      return [2, 4, 2];

    case 9:
    default:
      return [3, 3, 1];
  }
};

const renderRepresentative = async (
  srcs,
  maxImages,
  baseRenderer,
  { size = 96, margin = 0, padding = 2, backgroundColor = 0x000000 } = {}
) => {
  const n = Math.min(maxImages, srcs.length);
  const displayObjects = await baseRenderer(srcs.slice(0, n));

  const [rows, cols, aspectRatio] = getRegularGrid(n);

  const width = size;
  const height = size / aspectRatio;
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const cellAspectRatio = cellWidth / cellHeight;

  const gfx = new PIXI.Graphics();
  gfx
    .beginFill(backgroundColor)
    .drawRect(
      0,
      0,
      width + 2 * margin + (cols - 1) * padding,
      height + 2 * margin + (rows - 1) * padding
    )
    .endFill();

  displayObjects.forEach((displayObject, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;

    const objectAspectRatio = displayObject.width / displayObject.height;
    const isMorePortrait = objectAspectRatio < cellAspectRatio;

    const scaleFactor = isMorePortrait
      ? cellWidth / displayObject.width
      : cellHeight / displayObject.height;

    displayObject.width *= scaleFactor;
    displayObject.height *= scaleFactor;

    displayObject.x = (col + 0.5) * cellWidth + col * padding + margin;
    displayObject.y = (row + 0.5) * cellHeight + row * padding + margin;

    gfx.addChild(displayObject);

    const mask = new PIXI.Graphics();
    mask
      .beginFill(0xff0000, 0.5)
      .drawRect(
        col * cellWidth + col * padding + margin,
        row * cellHeight + row * padding + margin,
        cellWidth,
        cellHeight
      )
      .endFill();

    displayObject.mask = mask;
    gfx.addChild(mask);
  });

  return gfx;
};

const createRepresentativeRenderer = (n, baseRenderer, options) => sources =>
  Promise.all(
    sources.map(srcs => renderRepresentative(srcs, n, baseRenderer, options))
  );

export default createRepresentativeRenderer;
