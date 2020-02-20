import {
  assign,
  pipe,
  withConstructor,
  withStaticProperty
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withColorFilters from './with-color-filters';
import withDestroy from './with-destroy';
import withSize from './with-size';

const createImage = (texture, { anchor = [0.5, 0.5] } = {}) => {
  let sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(...anchor);

  const updateSprite = newTexture => {
    sprite = new PIXI.Sprite(newTexture);
  };

  const withPublicMethods = () => self =>
    assign(self, {
      updateSprite
    });

  return pipe(
    withStaticProperty('displayObject', sprite),
    withStaticProperty('sprite', sprite),
    withColorFilters(sprite),
    withSize(sprite),
    withDestroy(sprite),
    withPublicMethods(),
    withConstructor(createImage)
  )({});
};

export default createImage;
