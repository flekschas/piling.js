import * as PIXI from 'pixi.js';

const createItem = (id, texture, previewTexture, pubSub) => {
  const sprite = new PIXI.Sprite(texture);
  const preview = new PIXI.Sprite(previewTexture);

  const originalPosition = [0, 0]; // use original position

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

  preview.interactive = true;
  preview.buttonMode = true;

  preview.on('pointerover', onPointerOver).on('pointerout', onPointerOut);

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
