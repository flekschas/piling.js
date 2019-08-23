import * as PIXI from 'pixi.js';

const createItem = (id, sprite, pubSub) => {
  const clone = () => {
    const clonedItem = new PIXI.Sprite(sprite.texture);
    clonedItem.interactive = true;
    clonedItem.x = sprite.x;
    clonedItem.y = sprite.y;
    clonedItem.width = sprite.width;
    clonedItem.height = sprite.height;
    clonedItem.angle = sprite.angle;

    return clonedItem;
  };

  const destroy = () => {};

  const onPointerOver = () => {
    // eslint-disable-next-line no-use-before-define
    pubSub.publish('itemOver', { item: self });
  };

  const onPointerOut = () => {
    pubSub.publish('itemOut');
  };

  sprite.interactive = true;
  sprite.buttonMode = true;

  sprite
    // .on('pointerdown', onMouseDown)
    // .on('pointerup', onMouseUp)
    // .on('pointerupoutside', onMouseUp)
    .on('pointerover', onPointerOver)
    .on('pointerout', onPointerOut);

  const self = {
    clone,
    destroy,
    sprite,
    id
  };

  return self;
};

export default createItem;
