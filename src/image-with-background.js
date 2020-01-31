import {
  assign,
  pipe,
  withConstructor,
  withReadOnlyProperty
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

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
      backgroundGraphics.clear();
      backgroundGraphics.beginFill(color, opacity);
      backgroundGraphics.drawRect(
        0,
        0,
        self.width + self.padding,
        self.height + self.padding
      );
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
    backgroundColor = DEFAULT_BACKGROUND_COLOR,
    backgroundOpacity = DEFAULT_BACKGROUND_OPACITY,
    padding = DEFAULT_PADDING
  } = {}
) => {
  const backgroundGraphics = new PIXI.Graphics();
  const sprite = new PIXI.Sprite(texture);

  const init = self => {
    self.sprite.y = self.padding / 2;
    self.sprite.x = self.padding / 2;

    backgroundGraphics.addChild(sprite);

    return self;
  };

  return init(
    pipe(
      withReadOnlyProperty('displayObject', backgroundGraphics),
      withReadOnlyProperty('sprite', sprite),
      withSize(sprite),
      withPadding(padding),
      withBackground({
        backgroundColor,
        backgroundGraphics,
        backgroundOpacity
      }),
      withConstructor(createImageWithBackground)
    )({})
  );
};

export default createImageWithBackground;
