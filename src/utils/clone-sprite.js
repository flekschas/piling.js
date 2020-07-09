import * as PIXI from 'pixi.js';

const cloneSprite = (sprite) => {
  let clonedSprite;
  if (sprite.isSprite) {
    clonedSprite = new PIXI.Sprite(sprite.texture);
    clonedSprite.interactive = sprite.interactive;
    clonedSprite.x = sprite.x;
    clonedSprite.y = sprite.y;
    clonedSprite.anchor = sprite.anchor;
    clonedSprite.width = sprite.width;
    clonedSprite.height = sprite.height;
    clonedSprite.angle = sprite.angle;
  } else if (sprite instanceof PIXI.Mesh) {
    clonedSprite = new PIXI.Mesh(sprite.geometry, sprite.shader, sprite.state);
    clonedSprite.interactive = sprite.interactive;
    clonedSprite.x = sprite.x;
    clonedSprite.y = sprite.y;
    clonedSprite.anchor = sprite.anchor;
    clonedSprite.width = sprite.width;
    clonedSprite.height = sprite.height;
    clonedSprite.angle = sprite.angle;
  }

  return clonedSprite;
};

export default cloneSprite;
