import {
  assign,
  pipe,
  withConstructor,
  withProperty,
  withStaticProperty
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
  const withDestroy = () => self =>
    assign(self, {
      destroy() {
        if (self.image) self.image.destroy();
        if (self.preview) self.preview.destroy();
      }
    });

  return pipe(
    withStaticProperty('id', id),
    withStaticProperty('image', image),
    withStaticProperty('preview', preview),
    withProperty('originalPosition', {
      initialValue: originalPosition,
      cloner: v => [...v]
    }),
    withDestroy(),
    withConstructor(createItem)
  )({});
};

export default createItem;
