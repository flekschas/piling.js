import { pipe, withConstructor, withStaticProperty } from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withClone from './with-clone';
import withColorFilters from './with-color-filters';
import withDestroy from './with-destroy';
import withScale from './with-scale';
import withSize from './with-size';

import { toDisplayObject } from './utils';

const createImage = (source, { anchor = [0.5, 0.5] } = {}) => {
  const container = new PIXI.Container();
  const displayObject = toDisplayObject(source);
  let sprite;

  if (displayObject instanceof PIXI.Texture) {
    const border = new PIXI.Sprite(PIXI.Texture.WHITE);
    border.width = displayObject.width + 6;
    border.height = displayObject.height + 6;
    border.anchor.set(...anchor);

    sprite = new PIXI.Sprite(displayObject);
    sprite.anchor.set(...anchor);

    container.addChild(border);
    container.addChild(sprite);
  } else {
    sprite = displayObject;
    container.addChild(sprite);
  }

  return pipe(
    withConstructor(createImage),
    withStaticProperty('displayObject', container),
    withStaticProperty('sprite', sprite),
    withClone(sprite, { anchor }),
    withColorFilters(sprite),
    withScale(container, displayObject.width, displayObject.height),
    withSize(container, displayObject.width, displayObject.height),
    withDestroy(sprite)
  )({});
};

export default createImage;
