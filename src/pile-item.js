import {
  assign,
  pipe,
  withConstructor,
  withReadOnlyProperty,
  withStaticProperty,
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withAnimatedProperty from './with-animated-property';

const withDestroy = (container) => (self) =>
  assign(self, {
    destroy() {
      return container.destroy();
    },
  });

const withMoveTo = () => (self) =>
  assign(self, {
    moveTo(x, y) {
      if (!Number.isNaN(+x) && !Number.isNaN(+y)) {
        self.displayObject.x = x;
        self.displayObject.y = y;
      }
    },
  });

const withInteractivity = (pubSub) => (self) =>
  assign(self, {
    pointerOverHandler() {
      pubSub.publish('itemOver', { item: self });
    },
    pointerOutHandler() {
      pubSub.publish('itemOut', { item: self });
    },
    disableInteractivity() {
      self.displayObject.interactive = false;
      self.displayObject.buttonMode = false;
      self.displayObject.off('pointerover', self.pointerOverHandler);
      self.displayObject.off('pointerout', self.pointerOutHandler);
    },
    enableInteractivity() {
      self.displayObject.interactive = true;
      self.displayObject.buttonMode = true;
      self.displayObject.on('pointerover', self.pointerOverHandler);
      self.displayObject.on('pointerout', self.pointerOutHandler);
    },
  });

const createPileItem = ({ image, item, pubSub }) => {
  const container = new PIXI.Container();
  // eslint-disable-next-line no-underscore-dangle
  container.__pilingjs__item = item; // Dirty: for quick access in pile.js

  const replaceImage = (newImage) => {
    // eslint-disable-next-line no-param-reassign
    image = newImage;
    container.removeChildren();
    container.addChild(image.displayObject);
  };

  const withPublicMethods = () => (self) =>
    assign(self, {
      replaceImage,
    });

  const init = (self) => {
    self.displayObject.addChild(self.image.displayObject);

    self.enableInteractivity();

    return self;
  };

  return init(
    pipe(
      withStaticProperty('displayObject', container),
      withReadOnlyProperty('x', () => container.x),
      withReadOnlyProperty('y', () => container.y),
      withStaticProperty('id', item.id),
      withReadOnlyProperty('image', () => image),
      withStaticProperty('item', item),
      withAnimatedProperty(
        {
          name: 'opacity',
          pubSub,
        },
        {
          getter: () => container.alpha,
          setter: (newAlpha) => {
            container.alpha = newAlpha;
          },
        }
      ),
      withDestroy(container),
      withMoveTo(),
      withInteractivity(pubSub),
      withPublicMethods(),
      withConstructor(createPileItem)
    )({})
  );
};

export default createPileItem;
