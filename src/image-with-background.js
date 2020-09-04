import {
  assign,
  pipe,
  withConstructor,
  withStaticProperty,
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withColorFilters from './with-color-filters';
import withDestroy from './with-destroy';
import withScale from './with-scale';
import withSize from './with-size';
import { toDisplayObject } from './utils';

const DEFAULT_BACKGROUND_COLOR = 0x00ff00;
const DEFAULT_BACKGROUND_OPACITY = 0.2;
const DEFAULT_PADDING = 0;

const withBackground = ({ background, backgroundColor, backgroundOpacity }) => (
  self
) =>
  assign(self, {
    get backgroundColor() {
      return background.tint;
    },
    setBackgroundColor(color = backgroundColor) {
      background.tint = color;
    },
    get backgroundOpacity() {
      return background.alpha;
    },
    setBackgroundOpacity(opacity = backgroundOpacity) {
      background.alpha = opacity;
    },
    rescaleBackground(withPadding = false) {
      const width = self.width + self.padding * withPadding;
      const height = self.height + self.padding * withPadding;

      background.x = -width / 2;
      background.y = -height / 2;
      background.width = width;
      background.height = height;
    },
  });

const withPadding = (initialPadding) => (self) => {
  let padding = initialPadding;
  return assign(self, {
    get padding() {
      return padding;
    },
    setPadding(newPadding) {
      padding = Number.isNaN(+newPadding) ? +newPadding : padding;
    },
  });
};

const createImageWithBackground = (
  source,
  {
    anchor = [0.5, 0.5],
    backgroundColor = DEFAULT_BACKGROUND_COLOR,
    backgroundOpacity = DEFAULT_BACKGROUND_OPACITY,
    padding = DEFAULT_PADDING,
  } = {}
) => {
  const container = new PIXI.Container();
  const background = new PIXI.Sprite(PIXI.Texture.WHITE);
  const displayObject = toDisplayObject(source);

  let sprite;

  if (displayObject instanceof PIXI.Texture) {
    sprite = new PIXI.Sprite(displayObject);
    sprite.anchor.set(...anchor);
  } else {
    sprite = displayObject;
  }

  container.addChild(background);
  container.addChild(sprite);

  return pipe(
    withStaticProperty('displayObject', container),
    withStaticProperty('sprite', sprite),
    withColorFilters(sprite),
    withScale(sprite, displayObject.width, displayObject.height),
    withSize(sprite, displayObject.width, displayObject.height),
    withPadding(padding),
    withBackground({
      background,
      backgroundColor,
      backgroundOpacity,
    }),
    withDestroy(sprite),
    withConstructor(createImageWithBackground)
  )({});
};

export default createImageWithBackground;
