import { pipe, withConstructor, withStaticProperty } from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withSize from './with-size';
import withTint from './with-tint';

const createImage = (texture, { anchor = [0.5, 0.5] } = {}) => {
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(...anchor);

  return pipe(
    withStaticProperty('displayObject', sprite),
    withStaticProperty('sprite', sprite),
    withSize(sprite),
    withTint(sprite),
    withConstructor(createImage)
  )({});
};

export default createImage;
