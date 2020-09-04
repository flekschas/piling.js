import * as PIXI from 'pixi.js';

import isNdarray from './is-ndarray';

const toDisplayObject = (source) => {
  let displayObject = source;
  if (
    !(displayObject instanceof PIXI.Texture) &&
    !(displayObject instanceof PIXI.Graphics) &&
    !(displayObject instanceof PIXI.Mesh)
  ) {
    if (isNdarray(source)) {
      displayObject = PIXI.Texture.fromBuffer(
        source.data,
        source.shape[0],
        source.shape[1]
      );
    } else {
      displayObject = PIXI.Texture.from(source);
    }
  }
  return displayObject;
};

export default toDisplayObject;
