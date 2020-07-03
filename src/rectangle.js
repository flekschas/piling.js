import {
  pipe,
  withConstructor,
  withForwardedMethod,
  withStaticProperty
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

const createRectangle = initialOptions => {
  const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);

  const update = ({ color, opacity, width, height, x, y } = {}) => {
    if (color !== undefined) sprite.tint = color;
    if (width !== undefined) sprite.width = width;
    if (height !== undefined) sprite.height = height;
    if (opacity !== undefined) sprite.alpha = opacity;
    if (x !== undefined) sprite.x = x;
    if (y !== undefined) sprite.y = y;
  };

  if (initialOptions !== undefined) update(initialOptions);

  return pipe(
    withConstructor(createRectangle),
    withStaticProperty('displayObject', sprite),
    withForwardedMethod('destroy', sprite.destroy)
  )({
    update
  });
};

export default createRectangle;
