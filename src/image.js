import * as PIXI from 'pixi.js';

import { assignWithState } from './utils';

const DEFAULT_BACKGROUND_COLOR = 0x00ff00;
const DEFAULT_BACKGROUND_OPACITY = 0.2;
const DEFAULT_PADDING = 0;

const withDisplayObject = (self, state) => ({
  get displayObject() {
    return state.displayObject;
  }
});

const withSize = (self, state) => ({
  get aspectRatio() {
    return state.sprite.width / state.sprite.height;
  },
  get height() {
    return state.sprite.height;
  },
  get innerHeight() {
    return state.sprite.height;
  },
  get size() {
    return Math.max(state.sprite.width, state.sprite.height);
  },
  get width() {
    return state.sprite.width;
  },
  get innerWidth() {
    return state.sprite.width;
  }
});

const withSprite = (self, state) => ({
  get sprite() {
    return state.sprite;
  }
});

const withBackground = (self, state) => ({
  get backgroundColor() {
    return state.backgroundColor || DEFAULT_BACKGROUND_COLOR;
  },
  get backgroundOpacity() {
    return state.backgroundOpacity || DEFAULT_BACKGROUND_OPACITY;
  },
  drawBackground(
    color = state.backgroundColor,
    opacity = state.backgroundOpacity
  ) {
    state.backgroundGraphics.clear();
    state.backgroundGraphics.beginFill(color, opacity);
    state.backgroundGraphics.drawRect(0, 0, self.width, self.height);
    state.backgroundGraphics.endFill();
  }
});

const withPadding = (self, state) => ({
  get padding() {
    return state.padding;
  },
  set padding(newPadding) {
    state.padding = Number.isNaN(+newPadding) ? +newPadding : state.padding;
  },
  get height() {
    return state.sprite.height + state.padding;
  },
  get width() {
    return state.sprite.width + state.padding;
  }
});

const basicImageProps = (self, state) =>
  assignWithState(self, state, withDisplayObject, withSize, withSprite);

export const createImage = texture => {
  const state = { sprite: new PIXI.Sprite(texture) };
  state.displayObject = state.sprite;

  return assignWithState({}, state, basicImageProps);
};

export const createImageWithBackground = (
  texture,
  {
    backgroundColor = DEFAULT_BACKGROUND_COLOR,
    backgroundOpacity = DEFAULT_BACKGROUND_OPACITY,
    padding = DEFAULT_PADDING
  } = {}
) => {
  const init = (self, state) => {
    state.sprite.y = state.padding / 2;
    state.sprite.x = state.padding / 2;

    state.backgroundGraphics.addChild(state.sprite);

    self.drawBackground();

    return self;
  };

  const state = {
    backgroundColor,
    backgroundGraphics: new PIXI.Graphics(),
    backgroundOpacity,
    padding,
    sprite: new PIXI.Sprite(texture)
  };
  state.displayObject = state.backgroundGraphics;

  const self = assignWithState(
    {},
    state,
    basicImageProps,
    withBackground,
    withPadding
  );

  init(self, state);

  return self;
};
