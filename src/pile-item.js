import {
  assign,
  pipe,
  withConstructor,
  withReadOnlyProperty,
  withStaticProperty
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import withAnimatedProperty from './with-animated-property';

const withDestroy = container => self =>
  assign(self, {
    destroy() {
      return container.destroy();
    }
  });

const withMoveTo = () => self =>
  assign(self, {
    moveTo(x, y) {
      if (!Number.isNaN(+x) && !Number.isNaN(+y)) {
        self.displayObject.x = x;
        self.displayObject.y = y;
      }
    }
  });

const createPileItem = ({ image, item, pubSub }) => {
  const init = self => {
    self.displayObject.addChild(self.image.displayObject);

    const pointerOverHandler = () => {
      pubSub.publish('itemOver', { item: self });
    };
    const pointerOutHandler = () => {
      pubSub.publish('itemOut', { item: self });
    };

    self.displayObject.interactive = true;
    self.displayObject.buttonMode = true;
    self.displayObject.on('pointerover', pointerOverHandler);
    self.displayObject.on('pointerout', pointerOutHandler);

    return self;
  };

  const container = new PIXI.Container();
  // eslint-disable-next-line no-underscore-dangle
  container.__pilingjs__item = item; // Dirty: for quick access in pile.js

  const replaceImage = newImage => {
    // eslint-disable-next-line no-param-reassign
    image = newImage;
    container.removeChildren();
    container.addChild(image.displayObject);
  };

  const withPublicMethods = () => self =>
    assign(self, {
      replaceImage
    });

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
          pubSub
        },
        {
          getter: () => container.alpha,
          setter: newAlpha => {
            container.alpha = newAlpha;
          }
        }
      ),
      withDestroy(container),
      withMoveTo(),
      withPublicMethods(),
      withConstructor(createPileItem)
    )({})
  );
};

export default createPileItem;
