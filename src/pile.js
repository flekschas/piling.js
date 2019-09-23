import * as PIXI from 'pixi.js';

import createTweener from './tweener';
import { interpolateNumber, interpolateVector } from './utils';

const MAX_SCALE = 3;

/**
 * Factory function to create a pile
 * @param {object} initialItem - The first item on the pile
 * @param {function} renderRaf - Render withRaf function
 * @param {number} id - Pile identifier
 * @param {object} pubSub - Local pubSub instance
 */
const createPile = (initialItem, renderRaf, id, pubSub) => {
  const itemsById = new Map();
  const newItemsById = new Map();
  const graphics = new PIXI.Graphics();
  const itemContainer = new PIXI.Container();
  const borderContainer = new PIXI.Container();
  const hoverItemContainer = new PIXI.Container();
  const border = new PIXI.Graphics();

  const bBox = {
    minX: null,
    minY: null,
    maxX: null,
    maxY: null,
    pileId: id
  };

  let isFocus = false;
  let isTempDepiled = false;
  let hasCover = false;

  let isPositioning = false;

  const pubSubSubscribers = [];
  let hoverItemSubscriber;
  let hoverItemEndSubscriber;

  const destroy = () => {
    graphics.destroy();
    pubSubSubscribers.forEach(subscriber => {
      pubSub.unsubscribe(subscriber);
    });
  };

  // eslint-disable-next-line no-shadow
  const handleHoverItem = ({ item }) => {
    if (isFocus) {
      if (!graphics.isDragging) {
        const clonedSprite = item.cloneSprite();
        hoverItemContainer.addChild(clonedSprite);
        renderRaf();
      }
    }
  };

  const handleHoverItemEnd = () => {
    if (isFocus) {
      if (hoverItemContainer.children.length === 2)
        hoverItemContainer.removeChildAt(0);
      renderRaf();
    }
  };

  const drawBorder = (thickness, color) => {
    // while positioning, do not draw border
    if (isPositioning) return;
    const rect = itemContainer.getBounds();

    if (graphics.scale.x !== 1) {
      rect.width /= graphics.scale.x;
      rect.height /= graphics.scale.x;
    }

    pubSub.publish('updateBBox', id);

    border.clear();

    // draw black background
    border.beginFill(0x00000);
    border.drawRect(
      bBox.minX - graphics.x - thickness,
      bBox.minY - graphics.y - thickness,
      rect.width + 2 * thickness,
      rect.height + 2 * thickness
    );
    border.endFill();

    // draw border
    border.lineStyle(thickness, color, 1);
    border.drawRect(
      bBox.minX - graphics.x - thickness,
      bBox.minY - graphics.y - thickness,
      rect.width + 2 * thickness,
      rect.height + 2 * thickness
    );

    renderRaf();
  };

  const onPointerDown = () => {
    graphics.isPointerDown = true;
  };

  const onPointerUp = () => {
    graphics.isPointerDown = false;
  };

  const onPointerOver = () => {
    graphics.isHover = true;
    if (isFocus) {
      if (isTempDepiled) {
        drawBorder(3, 0xe87a90);
      } else {
        drawBorder(2, 0xfeeb77);
      }
    } else {
      drawBorder(1, 0x91989f);
    }
    // pubSub subscription for hoverItem
    if (!hoverItemSubscriber) {
      hoverItemSubscriber = pubSub.subscribe('itemOver', handleHoverItem);
      pubSubSubscribers.push(hoverItemSubscriber);
    }
    if (!hoverItemEndSubscriber) {
      hoverItemEndSubscriber = pubSub.subscribe('itemOver', handleHoverItemEnd);
      pubSubSubscribers.push(hoverItemEndSubscriber);
    }
  };

  const onPointerOut = () => {
    if (graphics.isDragging) return;
    graphics.isHover = false;

    if (!isFocus) border.clear();

    // pubSub unsubscription for hoverItem
    if (hoverItemSubscriber) {
      pubSub.unsubscribe(hoverItemSubscriber);
      hoverItemSubscriber = undefined;
    }
    if (hoverItemEndSubscriber) {
      pubSub.unsubscribe(hoverItemEndSubscriber);
      hoverItemEndSubscriber = undefined;
    }
    hoverItemContainer.removeChildren();
    renderRaf();
  };

  const onDragStart = event => {
    pubSub.publish('dragPile', { pileId: id });

    // first get the offset from the Pointer position to the current pile.x and pile.y
    // And store it (draggingMouseOffset = [x, y])
    graphics.draggingMouseOffset = [
      event.data.getLocalPosition(graphics.parent).x - graphics.x,
      event.data.getLocalPosition(graphics.parent).y - graphics.y
    ];
    graphics.alpha = 1;
    graphics.isDragging = true;
    graphics.beforeDragX = graphics.x;
    graphics.beforeDragY = graphics.y;
    renderRaf();
  };

  const onDragEnd = () => {
    if (!graphics.isDragging) return;
    graphics.alpha = 1;
    graphics.isDragging = false;
    graphics.draggingMouseOffset = null;
    // trigger collision check
    pubSub.publish('dropPile', { pileId: id });
    renderRaf();
  };

  const onDragMove = event => {
    if (graphics.isDragging) {
      const newPosition = event.data.getLocalPosition(graphics.parent);
      // remove offset
      graphics.x = newPosition.x - graphics.draggingMouseOffset[0];
      graphics.y = newPosition.y - graphics.draggingMouseOffset[1];
      pubSub.publish('highlightPile', { pileId: id });
      if (isTempDepiled) {
        drawBorder(3, 0xe87a90);
      } else {
        drawBorder(2, 0xfeeb77);
      }
      renderRaf();
    }
  };

  const setBBox = newBBox => {
    bBox.minX = newBBox.minX;
    bBox.minY = newBBox.minY;
    bBox.maxX = newBBox.maxX;
    bBox.maxY = newBBox.maxY;
  };

  const calcBBox = () => {
    // compute bounding box

    const scale = graphics.scale.x;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    itemContainer.children.forEach(element => {
      const x = element.x + graphics.x;
      const y = element.y + graphics.y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + element.width * scale > maxX) maxX = x + element.width * scale;
      if (y + element.height * scale > maxY) maxY = y + element.height * scale;
    });

    return {
      minX,
      minY,
      maxX,
      maxY
    };
  };

  const updateBBox = () => {
    setBBox(calcBBox());
  };

  const getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
  };

  const animatePositionItems = (item, x, y, animator, isLastOne) => {
    const tweener = createTweener({
      duration: 250,
      interpolator: interpolateVector,
      endValue: [x, y],
      getter: () => {
        return [item.x, item.y];
      },
      setter: newValue => {
        item.x = newValue[0];
        item.y = newValue[1];
      },
      onDone: () => {
        if (isLastOne) isPositioning = false;
      }
    });
    animator.add(tweener);
  };

  const positionItems = (itemAlignment, itemRotated, animator) => {
    isPositioning = true;
    if (hasCover) {
      // matrix
      itemContainer.children.forEach((item, index) => {
        if (index === itemContainer.children.length - 1) return;
        const padding = item.height * (index + 1);
        if (index === itemContainer.children.length - 2)
          animatePositionItems(item, 2, -padding, animator, true);
        else animatePositionItems(item, 2, -padding, animator, false);
      });
    } else if (itemAlignment) {
      // image
      newItemsById.forEach((item, index) => {
        if (!Number.isNaN(+item.tmpAbsX) && !Number.isNaN(+item.tmpAbsY)) {
          item.x = item.x + item.tmpAbsX - graphics.x;
          item.y = item.y + item.tmpAbsY - graphics.y;
          item.tmpAbsX = undefined;
          item.tmpAbsY = undefined;
        }
        itemsById.set(index, item);
      });
      newItemsById.clear();
      itemContainer.children.forEach((item, index) => {
        // eslint-disable-next-line no-param-reassign
        if (!Array.isArray(itemAlignment)) itemAlignment = [itemAlignment];
        const padding = index * 5;
        let verticalPadding = 0;
        let horizontalPadding = 0;
        itemAlignment.forEach(alignment => {
          switch (alignment) {
            case 'top':
              verticalPadding -= padding;
              break;
            case 'left':
              horizontalPadding -= padding;
              break;
            case 'bottom':
              verticalPadding += padding;
              break;
            case 'right':
              horizontalPadding += padding;
              break;
            // bottom-right
            default:
              verticalPadding += padding;
              horizontalPadding += padding;
          }
        });
        if (index === itemContainer.children.length - 1)
          animatePositionItems(
            item,
            horizontalPadding + 2,
            verticalPadding + 2,
            animator,
            true
          );
        else
          animatePositionItems(
            item,
            horizontalPadding + 2,
            verticalPadding + 2,
            animator,
            false
          );
      });
    } else {
      // randomized offset
      const x = getRandomArbitrary(-30, 30);
      const y = getRandomArbitrary(-30, 30);
      let rotation;
      if (itemRotated) {
        rotation = getRandomArbitrary(-10, 10);
      }
      let num = 0;
      newItemsById.forEach((item, index) => {
        num++;
        if (!Number.isNaN(+item.tmpAbsX) && !Number.isNaN(+item.tmpAbsY)) {
          item.x = item.x + item.tmpAbsX - graphics.x;
          item.y = item.y + item.tmpAbsY - graphics.y;
          item.tmpAbsX = undefined;
          item.tmpAbsY = undefined;
        }
        itemsById.set(index, item);
        if (num === newItemsById.size)
          animatePositionItems(item, x, y, animator, true);
        else animatePositionItems(item, x, y, animator, false);
        if (rotation) {
          item.angle += rotation;
        }
      });
      newItemsById.clear();
    }
  };

  const scale = wheelDelta => {
    const force = Math.log(Math.abs(wheelDelta) + 1);
    const momentum = Math.sign(wheelDelta) * force;

    const newScale = Math.min(
      Math.max(1, graphics.scale.y * (1 + 0.075 * momentum)),
      MAX_SCALE
    );

    if (newScale > 1) {
      graphics.scale.x = newScale;
      graphics.scale.y = newScale;
      return true;
    }
    return false;
  };

  let scaleUp = false;
  let scaleTweener;
  const animateScale = () => {
    let duration = 250;
    if (scaleTweener) {
      pubSub.publish('cancelAnimation', scaleTweener);
      const Dt = scaleTweener.getDt();
      if (Dt < duration && scaleUp) {
        duration = Dt;
      }
    }
    scaleTweener = createTweener({
      duration,
      delay: 0,
      interpolator: interpolateNumber,
      endValue: scaleUp ? 1 : MAX_SCALE,
      getter: () => {
        return graphics.scale.x;
      },
      setter: newScale => {
        graphics.scale.x = newScale;
        graphics.scale.y = newScale;
      },
      onDone: () => {
        pubSub.publish('updateBBox', id);
      }
    });
    pubSub.publish('animate', scaleTweener);
    scaleUp = !scaleUp;
  };

  const init = () => {
    graphics.addChild(borderContainer);
    graphics.addChild(itemContainer);
    graphics.addChild(hoverItemContainer);

    graphics.interactive = true;
    graphics.buttonMode = true;
    graphics.x = 0;
    graphics.y = 0;
    // Origin of the items coordinste system relative to the pile
    initialItem.anchor.set(0);
    initialItem.x = 2;
    initialItem.y = 2;

    borderContainer.addChild(border);

    graphics
      .on('pointerdown', onPointerDown)
      .on('pointerup', onPointerUp)
      .on('pointerupoutside', onPointerUp)
      .on('pointerover', onPointerOver)
      .on('pointerout', onPointerOut);

    graphics
      .on('pointerdown', onDragStart)
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      .on('pointermove', onDragMove);

    itemContainer.addChild(initialItem);

    itemsById.set(id, initialItem);
  };

  init();

  return {
    destroy,
    drawBorder,
    border,
    itemsById,
    newItemsById,
    graphics,
    itemContainer,
    id,
    bBox,
    calcBBox,
    updateBBox,
    positionItems,
    get hasCover() {
      return hasCover;
    },
    set hasCover(newHasCover) {
      hasCover = !!newHasCover;
    },
    get isFocus() {
      return isFocus;
    },
    set isFocus(newIsFocus) {
      isFocus = !!newIsFocus;
    },
    get isTempDepiled() {
      return isTempDepiled;
    },
    set isTempDepiled(newIsTempDepiled) {
      isTempDepiled = !!newIsTempDepiled;
    },
    scale,
    animateScale,
    animatePositionItems
  };
};

export default createPile;
