import * as PIXI from 'pixi.js';

const cloneSprite = sprite => {
  const clonedSprite = new PIXI.Sprite(sprite.texture);
  clonedSprite.interactive = sprite.interactive;
  clonedSprite.x = sprite.x;
  clonedSprite.y = sprite.y;
  clonedSprite.anchor = sprite.anchor;
  clonedSprite.width = sprite.width;
  clonedSprite.height = sprite.height;
  clonedSprite.angle = sprite.angle;

  return clonedSprite;
};

export default cloneSprite;
