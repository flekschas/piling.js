import * as PIXI from 'pixi.js';

import { pipe } from './utils';
import withConstructor from './with-constructor';
import withReadOnlyProperty from './with-read-only-property';
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
