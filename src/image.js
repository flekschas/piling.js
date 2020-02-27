import { pipe, withConstructor, withStaticProperty } from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withColorFilters from './with-color-filters';
import withDestroy from './with-destroy';
import withScale from './with-scale';
import withSize from './with-size';

const createImage = (texture, { anchor = [0.5, 0.5] } = {}) => {
  let sprite;

  if (texture instanceof PIXI.Mesh) {
    sprite = texture;
  } else {
    sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(...anchor);
  }

  return pipe(
    withStaticProperty('displayObject', sprite),
    withStaticProperty('sprite', sprite),
    withColorFilters(sprite),
    withScale(sprite, texture.width, texture.height),
    withSize(sprite, texture.width, texture.height),
    withDestroy(sprite),
    withConstructor(createImage)
  )({});
};

export default createImage;
