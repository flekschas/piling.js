import { pipe, withConstructor, withStaticProperty } from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withColorFilters from './with-color-filters';
import withSize from './with-size';

const createImage = (texture, { anchor = [0.5, 0.5] } = {}) => {
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(...anchor);

  return pipe(
    withStaticProperty('displayObject', sprite),
    withStaticProperty('sprite', sprite),
    withColorFilters(sprite),
    withSize(sprite),
    withConstructor(createImage)
  )({});
};

export default createImage;
