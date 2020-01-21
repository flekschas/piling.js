import * as PIXI from 'pixi.js';

import withConstructor from './with-constructor';
import withAnimatedProperty from './with-animated-property';
import withReadOnlyProperty from './with-read-only-property';

import { assign, pipe } from './utils';

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

  return init(
    pipe(
      withReadOnlyProperty('displayObject', container),
      withReadOnlyProperty('id', item.id),
      withReadOnlyProperty('image', image),
      withReadOnlyProperty('item', item),
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
      withConstructor(createPileItem)
    )({})
  );
};

export default createPileItem;
