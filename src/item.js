import * as PIXI from 'pixi.js';
import createTweener from './tweener';
import { interpolateNumber } from './utils';

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

  const getOpacity = () => sprite.alpha;
  const setOpacity = newOpacity => {
    sprite.alpha = newOpacity;
  };

  let opacityTweener;
  // eslint-disable-next-line consistent-return
  const opacity = (newOpacity, noAnimate) => {
    if (Number.isNaN(+newOpacity)) return getOpacity();

    if (noAnimate) {
      setOpacity(newOpacity);
    }

    let duration = 250;
    if (opacityTweener) {
      pubSub.publish('cancelAnimation', opacityTweener);
      const Dt = opacityTweener.getDt();
      if (Dt < duration) {
        duration = Dt;
      }
    }
    opacityTweener = createTweener({
      duration,
      delay: 0,
      interpolator: interpolateNumber,
      endValue: newOpacity,
      getter: getOpacity,
      setter: setOpacity
    });
    pubSub.publish('animate', opacityTweener);
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

  const moveTo = (x, y) => {
    if (!Number.isNaN(+x) && !Number.isNaN(+y)) {
      sprite.x = x;
      sprite.y = y;
    }
  };

  const self = {
    // Properties
    get id() {
      return id;
    },
    get x() {
      return sprite.x;
    },
    get y() {
      return sprite.y;
    },
    // Methods
    cloneSprite,
    destroy,
    moveTo,
    opacity,
    originalPosition,
    preview,
    sprite
  };

  return self;
};

export default createItem;
