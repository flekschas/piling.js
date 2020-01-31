import { pipe, withConstructor, withReadOnlyProperty } from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withSize from './with-size';

const createImage = texture => {
  const sprite = new PIXI.Sprite(texture);

  return pipe(
    withReadOnlyProperty('displayObject', sprite),
    withReadOnlyProperty('sprite', sprite),
    withSize(sprite),
    withConstructor(createImage)
  )({});
};

export default createImage;
