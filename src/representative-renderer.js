import * as PIXI from 'pixi.js';

import { toDisplayObject } from './utils';

/**
 * [description]
 * @param {number} n - Number of items
 * @return {array} Quintuple of number of number of images, rows,
 *   number of columns, aspectRatio, scaling
 */
const getRegularGrid = (n) => {
  switch (n) {
    case 1:
      return [1, 1, 1, 1, 1];

    case 2:
      return [2, 1, 2, 1.5, 1.25];

    case 3:
      return [3, 1, 3, 2, 1.35];

    case 4:
    case 5:
      return [4, 2, 2, 1, 1.25];

    case 6:
    case 7:
      return [6, 2, 3, 1.5, 1.5];

    case 8:
      return [8, 2, 4, 2, 1.7];

    case 9:
    default:
      return [9, 3, 3, 1, 1.5];
  }
};

const renderRepresentative = async (
  srcs,
  itemRenderer,
  {
    innerPadding = 2,
    outerPadding = 2,
    backgroundColor = 0x000000,
    maxNumberOfRepresentatives = 9,
  } = {}
) => {
  const n = Math.min(maxNumberOfRepresentatives, srcs.length);
  const [_n, rows, cols, aspectRatio] = getRegularGrid(n);

  const renderedItems = await itemRenderer(srcs.slice(0, _n));

  const relWidth = 1.0;
  const relHeight = 1.0 / aspectRatio;
  const cellAspectRatio = relHeight;

  const gfx = new PIXI.Graphics();

  let maxSize = -Infinity;

  renderedItems.forEach((renderedItem) => {
    maxSize = Math.max(maxSize, renderedItem.width, renderedItem.height);
  });

  const width = maxSize;
  const height = maxSize * cellAspectRatio;
  const cellWidth = maxSize * (relWidth / cols);
  const cellHeight = maxSize * (relHeight / rows);

  renderedItems.forEach((renderedItem, i) => {
    let displayObject = toDisplayObject(renderedItem);

    const isTexture = displayObject instanceof PIXI.Texture;
    if (isTexture) displayObject = new PIXI.Sprite(displayObject);

    const row = Math.floor(i / cols);
    const col = i % cols;

    const objectAspectRatio = displayObject.width / displayObject.height;
    const isMorePortrait = objectAspectRatio < cellAspectRatio;

    const scaleFactor = isMorePortrait
      ? cellWidth / displayObject.width
      : cellHeight / displayObject.height;

    // TODO: Fix this hack! One would expect to always scale the display object
    // but somehow this can lead to incorrect scales when the display object is
    // a PIXI Graphics object
    if (scaleFactor > 1 || isTexture) {
      displayObject.width *= scaleFactor;
      displayObject.height *= scaleFactor;
    }

    const objCol = isTexture ? col : col + 0.5;
    const objRow = isTexture ? row : row + 0.5;

    displayObject.x = objCol * cellWidth + col * innerPadding + outerPadding;
    displayObject.y = objRow * cellHeight + row * innerPadding + outerPadding;

    if (isTexture) {
      const size = isMorePortrait ? displayObject.width : displayObject.height;
      displayObject.x -= isMorePortrait ? 0 : (displayObject.width - size) / 2;
      displayObject.y -= isMorePortrait ? (displayObject.height - size) / 2 : 0;
    }

    gfx.addChild(displayObject);

    const mask = new PIXI.Graphics();
    mask
      .beginFill(0xff0000, 0.5)
      .drawRect(
        col * cellWidth + col * innerPadding + outerPadding,
        row * cellHeight + row * innerPadding + outerPadding,
        cellWidth,
        cellHeight
      )
      .endFill();

    displayObject.mask = mask;
    gfx.addChild(mask);
  });

  const finalWidth = width + (cols - 1) * innerPadding + 2 * outerPadding;
  const finalHeight = height + (rows - 1) * innerPadding + 2 * outerPadding;

  gfx
    .beginFill(backgroundColor)
    .drawRect(0, 0, finalWidth, finalHeight)
    .endFill();

  gfx.pivot.x = finalWidth / 2;
  gfx.pivot.y = finalHeight / 2;

  return gfx;
};

const createRepresentativeRenderer = (itemRenderer, options) => {
  const renderer = (sources) =>
    Promise.all(
      sources.map((srcs) => renderRepresentative(srcs, itemRenderer, options))
    );

  renderer.scaler = (pile) => getRegularGrid(pile.items.length)[4];

  return renderer;
};

export default createRepresentativeRenderer;
