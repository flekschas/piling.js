import {
  assign,
  pipe,
  withConstructor,
  withStaticProperty
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withColorFilters from './with-color-filters';
import withDestroy from './with-destroy';
import withScale from './with-scale';
import withSize from './with-size';

const DEFAULT_BACKGROUND_COLOR = 0x00ff00;
const DEFAULT_BACKGROUND_OPACITY = 0.2;
const DEFAULT_PADDING = 0;

const withBackground = ({
  backgroundColor,
  backgroundGraphics,
  backgroundOpacity
}) => self =>
  assign(self, {
    get backgroundColor() {
      return backgroundGraphics.fill.color;
    },
    get backgroundOpacity() {
      return backgroundGraphics.fill.alpha;
    },
    drawBackground(color = backgroundColor, opacity = backgroundOpacity) {
      const width = self.width + self.padding;
      const height = self.height + self.padding;

      backgroundGraphics.clear();
      backgroundGraphics.beginFill(color, opacity);
      backgroundGraphics.drawRect(-width / 2, -height / 2, width, height);
      backgroundGraphics.endFill();
    }
  });

const withPadding = initialPadding => self => {
  let padding = initialPadding;
  return assign(self, {
    get padding() {
      return padding;
    },
    setPadding(newPadding) {
      padding = Number.isNaN(+newPadding) ? +newPadding : padding;
    }
  });
};

const createImageWithBackground = (
  texture,
  {
    anchor = [0.5, 0.5],
    backgroundColor = DEFAULT_BACKGROUND_COLOR,
    backgroundOpacity = DEFAULT_BACKGROUND_OPACITY,
    padding = DEFAULT_PADDING
  } = {}
) => {
  const backgroundGraphics = new PIXI.Graphics();

  let sprite;
  if (texture instanceof PIXI.Texture) {
    sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(...anchor);
  } else {
    sprite = texture;
  }

  const init = self => {
    backgroundGraphics.addChild(sprite);

    return self;
  };

  return init(
    pipe(
      withStaticProperty('displayObject', backgroundGraphics),
      withStaticProperty('sprite', sprite),
      withColorFilters(sprite),
      withScale(sprite, texture.width, texture.height),
      withSize(sprite, texture.width, texture.height),
      withPadding(padding),
      withBackground({
        backgroundColor,
        backgroundGraphics,
        backgroundOpacity
      }),
      withDestroy(backgroundGraphics),
      withConstructor(createImageWithBackground)
    )({})
  );
};

export default createImageWithBackground;
