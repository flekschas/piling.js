import * as PIXI from 'pixi.js';

import createTweener from './tweener';
import { assignWithState, interpolateNumber } from './utils';

const withDestroy = (self, state) => ({
  destroy() {
    return state.container.destroy();
  }
});

const withDisplayObject = (self, state) => ({
  get displayObject() {
    return state.container;
  }
});

const withId = (self, state) => ({
  get id() {
    return state.item.id;
  }
});

const withImage = (self, state) => ({
  get image() {
    return state.image;
  }
});

const withItem = (self, state) => ({
  get item() {
    return state.item;
  }
});

const withMoveTo = self => ({
  moveTo(x, y) {
    if (!Number.isNaN(+x) && !Number.isNaN(+y)) {
      self.displayObject.x = x;
      self.displayObject.y = y;
    }
  }
});

const withOpacity = (self, state) => ({
  get opacity() {
    return self.displayObject.alpha;
  },
  set opacity(newOpacity) {
    self.displayObject.alpha = newOpacity;
  },
  animateOpacity(newOpacity) {
    let duration = 250;
    if (state.opacityTweener) {
      state.pubSub.publish('cancelAnimation', state.opacityTweener);
      const Dt = state.opacityTweener.getDt();
      if (Dt < duration) {
        duration = Dt;
      }
    }
    state.opacityTweener = createTweener({
      duration,
      delay: 0,
      interpolator: interpolateNumber,
      endValue: newOpacity,
      getter: () => self.opacity,
      setter: opacity => {
        self.opacity = opacity;
      }
    });
    state.pubSub.publish('animate', state.opacityTweener);
  }
});

const createPileItem = ({ image, item, pubSub }) => {
  const init = (self, state) => {
    state.container.addChild(state.image.displayObject);

    state.pointerOverHandler = () => {
      state.pubSub.publish('itemOver', { item: self });
    };
    state.pointerOutHandler = () => {
      state.pubSub.publish('itemOut', { item: self });
    };

    state.container.interactive = true;
    state.container.buttonMode = true;
    state.container.on('pointerover', state.pointerOverHandler);
    state.container.on('pointerout', state.pointerOutHandler);
  };

  const state = {
    container: new PIXI.Container(),
    image,
    item,
    pubSub
  };

  const self = assignWithState(
    {}, // Target
    state,
    // Read-only properties
    withDisplayObject,
    withId,
    withImage,
    withItem,
    // Read-write properties
    withOpacity,
    // Methods
    withDestroy,
    withMoveTo
  );

  init(self, state);

  return self;
};

export default createPileItem;
