import { assign } from './utils';

const withId = id => ({
  get id() {
    return id;
  }
});

const withImage = image => ({
  get image() {
    return image;
  }
});

const withPreview = preview => ({
  get preview() {
    return preview;
  }
});

const withOriginalPosition = ([x, y]) => {
  const originalPosition = [x, y];
  return {
    get originalPosition() {
      return [...originalPosition];
    },
    setOriginalPosition([newX, newY]) {
      originalPosition[0] = newX;
      originalPosition[1] = newY;
      return this;
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
const createItem = (
  { id, image },
  { preview = null, originalPosition = [0, 0] } = {}
) =>
  assign(
    {},
    withId(id),
    withImage(image),
    withPreview(preview),
    withOriginalPosition(originalPosition),
    withDestroy()
  );

export default createItem;
