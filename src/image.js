import { pipe, withConstructor, withStaticProperty } from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withColorFilters from './with-color-filters';
import withDestroy from './with-destroy';
import withScale from './with-scale';
import withSize from './with-size';

import { toDisplayObject } from './utils';

const createImage = (source, { anchor = [0.5, 0.5] } = {}) => {
  const displayObject = toDisplayObject(source);
  let sprite;

  if (displayObject instanceof PIXI.Texture) {
    sprite = new PIXI.Sprite(displayObject);
    sprite.anchor.set(...anchor);
  } else {
    sprite = displayObject;
  }

  return pipe(
    withStaticProperty('displayObject', sprite),
    withStaticProperty('sprite', sprite),
    withColorFilters(sprite),
    withScale(sprite, displayObject.width, displayObject.height),
    withSize(sprite, displayObject.width, displayObject.height),
    withDestroy(sprite),
    withConstructor(createImage)
  )({});
};

export default createImage;
