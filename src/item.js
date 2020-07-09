import {
  assign,
  pipe,
  withConstructor,
  withProperty,
  withReadOnlyProperty,
  withStaticProperty,
} from '@flekschas/utils';

/**
 * Factory function to create an item
 * @param {number} id - Item identifier
 * @param {object} texture - The PIXI.Texture object of the item
 * @param {object} preview - The PIXI.Graphics object of the item preview
 */
const createItem = (
  { id, image },
  { preview = null, originalPosition = [0, 0] } = {}
) => {
  const withDestroy = () => (self) =>
    assign(self, {
      destroy() {
        if (image) image.destroy();
        if (preview) preview.destroy();
      },
    });

  const replaceImage = (newImage, newPreview = null) => {
    image.destroy();
    // eslint-disable-next-line no-param-reassign
    image = newImage;
    if (preview) {
      preview.destroy();
      // eslint-disable-next-line no-param-reassign
      preview = null;
    }

    // eslint-disable-next-line no-param-reassign
    preview = newPreview;
  };

  const withPublicMethods = () => (self) =>
    assign(self, {
      replaceImage,
    });

  return pipe(
    withStaticProperty('id', id),
    withReadOnlyProperty('image', () => image),
    withReadOnlyProperty('preview', () => preview),
    withProperty('originalPosition', {
      initialValue: originalPosition,
      cloner: (v) => [...v],
    }),
    withDestroy(),
    withPublicMethods(),
    withConstructor(createItem)
  )({});
};

export default createItem;
