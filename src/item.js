import { assignWith } from './utils';

const withId = (self, state) => ({
  get id() {
    return state.id;
  }
});

const withImage = (self, state) => ({
  get image() {
    return state.image;
  }
});

const withPreview = (self, state) => ({
  get preview() {
    return state.preview;
  }
});

const withOriginalPosition = (self, state) => {
  state.originalPosition = [0, 0];
  return {
    get originalPosition() {
      return [...state.originalPosition];
    },
    set originalPosition(newOriginalPosition) {
      state.originalPosition = newOriginalPosition.slice(0, 2);
    }
  };
};

const withDestroy = () => ({
  destroy() {
    // To be implemented
  }
});

/**
 * Factory function to create an item
 * @param {number} id - Item identifier
 * @param {object} texture - The PIXI.Texture object of the item
 * @param {object} preview - The PIXI.Graphics object of the item preview
 */
const createItem = ({ id, image }, { preview = null } = {}) => {
  const state = { id, image, preview };
  return assignWith(state)(
    {},
    withId,
    withImage,
    withPreview,
    withOriginalPosition,
    withDestroy
  );
};

export default createItem;
