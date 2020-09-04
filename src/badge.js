import {
  assign,
  pipe,
  toVoid,
  withConstructor,
  withStaticProperty,
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import createImage from './image';
import withClone from './with-clone';

const createBadge = (
  text,
  { backgroundFactory, fontSize = 8, darkMode = false, onDestroy = toVoid } = {}
) => {
  const container = new PIXI.Container();

  let texture = text;

  if (!(text instanceof PIXI.Texture)) {
    const pixiText = new PIXI.Text(text, {
      fontFamily: 'sans-serif',
      fontSize: fontSize * window.devicePixelRatio,
      fill: 0xffffff,
      align: 'center',
    });
    pixiText.updateText();
    texture = pixiText.texture;
  }

  const image = createImage(texture);

  let background;
  if (backgroundFactory) {
    background = backgroundFactory.create();
    container.addChild(background);
  }
  container.addChild(image.displayObject);
  image.displayObject.width /= window.devicePixelRatio;
  image.displayObject.height /= window.devicePixelRatio;

  let destroyed = false;
  const withDestroy = () => (self) =>
    assign(self, {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        onDestroy();
      },
    });

  const setDarkMode = (newDarkMode) => {
    image.invert(newDarkMode);
    backgroundFactory.setColor(newDarkMode ? [1, 1, 1, 1] : [0, 0, 0, 1]);
  };

  setDarkMode(darkMode);

  return pipe(
    withConstructor(createBadge),
    withStaticProperty('displayObject', container),
    withStaticProperty('background', background),
    withStaticProperty('image', image),
    withClone(texture, { backgroundFactory, fontSize, darkMode, onDestroy }),
    withDestroy()
  )({
    setDarkMode,
  });
};

export default createBadge;
