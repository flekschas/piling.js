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
  itemRenderer,
  {
    innerPadding = 2,
    outerPadding = 2,
    backgroundColor = 0x000000,
    maxNumberOfRepresentatives = 9
  } = {}
) => {
  const n = Math.min(maxNumberOfRepresentatives, srcs.length);
  const renderedItems = await itemRenderer(srcs.slice(0, n));

  const [rows, cols, aspectRatio] = getRegularGrid(n);

  const width = 1.0;
  const height = 1.0 / aspectRatio;
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const cellAspectRatio = cellWidth / cellHeight;

  const gfx = new PIXI.Graphics();

  let completeWidth = 0;
  let completeHeight = 0;

  renderedItems.forEach((renderedItem, i) => {
    const displayObject =
      renderedItem instanceof PIXI.Texture
        ? new PIXI.Sprite(renderedItem)
        : renderedItem;

    const row = Math.floor(i / cols);
    const col = i % cols;

    const objectAspectRatio = displayObject.width / displayObject.height;
    const isMorePortrait = objectAspectRatio < cellAspectRatio;

    const size = isMorePortrait ? displayObject.width : displayObject.height;

    const cellAbsWidth = size * cellWidth;
    const cellAbsHeight = size * cellHeight;

    const xOffset = isMorePortrait ? 0 : (displayObject.width - size) / 2;
    const yOffset = isMorePortrait ? (displayObject.height - size) / 2 : 0;

    displayObject.x =
      (col - 0.5) * cellAbsWidth + col * innerPadding + outerPadding - xOffset;
    displayObject.y =
      (row - 0.5) * cellAbsHeight + row * innerPadding + outerPadding - yOffset;

    gfx.addChild(displayObject);

    const mask = new PIXI.Graphics();
    mask
      .beginFill(0xff0000, 1.0)
      .drawRect(
        (col - 0.5) * cellAbsWidth + col * innerPadding + outerPadding,
        (row - 0.5) * cellAbsHeight + row * innerPadding + outerPadding,
        cellAbsWidth,
        cellAbsHeight
      )
      .endFill();

    completeWidth += cellAbsWidth;
    completeHeight += cellAbsHeight;

    displayObject.mask = mask;
    gfx.addChild(mask);
  });

  const finalWidth = completeWidth + (cols - 1) * innerPadding;
  const finalHeight = completeHeight + (rows - 1) * innerPadding;

  gfx
    .beginFill(backgroundColor)
    .drawRect(
      -finalWidth / 2,
      -finalHeight / 2,
      finalWidth + 2 * outerPadding,
      finalHeight + 2 * outerPadding
    )
    .endFill();

  return gfx;
};

const createRepresentativeRenderer = (itemRenderer, options) => sources =>
  Promise.all(
    sources.map(srcs => renderRepresentative(srcs, itemRenderer, options))
  );

export default createRepresentativeRenderer;
