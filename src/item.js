const createItem = (id, sprite, pubSub) => {
  const clone = () => {
    return createItem(id, sprite, pubSub);
  };

  const destroy = () => {};

  const onPointerOver = () => {
    pubSub.publish('hoverItem', { id });
  };

  const onPointerOut = () => {
    pubSub.publish('finishHover', { id });
  };

  sprite.interactive = true;
  sprite.buttonMode = true;

  sprite
    // .on('pointerdown', onMouseDown)
    // .on('pointerup', onMouseUp)
    // .on('pointerupoutside', onMouseUp)
    .on('pointerover', onPointerOver)
    .on('pointerout', onPointerOut);

  return {
    clone,
    destroy,
    sprite,
    id
  };
};

export default createItem;
