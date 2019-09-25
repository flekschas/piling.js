import * as PIXI from 'pixi.js';

/**
 * Factory function to create an item
 * @param {number} id - Item identifier
 * @param {object} texture - The PIXI.Texture object of the item
 * @param {object} preview - The PIXI.Graphics object of the item preview
 * @param {object} pubSub - Local pubSub instance
 */
const createItem = (id, texture, preview, pubSub) => {
  const sprite = new PIXI.Sprite(texture);

  const originalPosition = [0, 0];

  const cloneSprite = () => {
    const clonedSprite = new PIXI.Sprite(texture);
    clonedSprite.interactive = true;
    clonedSprite.x = sprite.x;
    clonedSprite.y = sprite.y;
    clonedSprite.width = sprite.width;
    clonedSprite.height = sprite.height;
    clonedSprite.angle = sprite.angle;

    return clonedSprite;
  };

  const destroy = () => {};

  const onPointerOver = () => {
    // eslint-disable-next-line no-use-before-define
    pubSub.publish('itemOver', { item: self });
  };

  const onPointerOut = () => {
    // eslint-disable-next-line no-use-before-define
    pubSub.publish('itemOut', { item: self });
  };

  // Initalization
  sprite.interactive = true;
  sprite.buttonMode = true;

  sprite.on('pointerover', onPointerOver).on('pointerout', onPointerOut);

  if (preview) {
    preview.previewContainer
      .on('pointerover', onPointerOver)
      .on('pointerout', onPointerOut);
  }

  const self = {
    cloneSprite,
    destroy,
    sprite,
    preview,
    id,
    originalPosition
  };

  return self;
};

export default createItem;
