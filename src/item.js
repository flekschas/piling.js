import {
  pipe,
  withConstructor,
  withProperty,
  withReadOnlyProperty
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
) =>
  pipe(
    withReadOnlyProperty('id', id),
    withReadOnlyProperty('image', image),
    withReadOnlyProperty('preview', preview),
    withProperty('originalPosition', {
      initialValue: originalPosition,
      cloner: v => [...v]
    }),
    withConstructor(createItem)
  )({});

export default createItem;
