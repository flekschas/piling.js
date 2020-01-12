import * as PIXI from 'pixi.js';

import createTweener from './tweener';
import { interpolateNumber, interpolateVector } from './utils';

import { MODE_HOVER } from './preview';

export const MAX_SCALE = 3;
export const MODE_ACTIVE = 'Active';
export const MODE_SELECTED = 'Selected';

/**
 * Factory function to create a pile
 * @param {object}   options - The options
 * @param {object}   options.initialItem - The first item on the pile
 * @param {function} options.render - Render withRaf function
 * @param {number}   options.id - Pile identifier
 * @param {object}   options.pubSub - Local pubSub instance
 * @param {object}   options.store - Redux store
 */
const createPile = ({ initialItem, render, id, pubSub, store }) => {
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

  let cover;

  let isFocus = false;
  let isTempDepiled = false;
  let hasCover = false;
  let isPositioning = false;
  let cX;
  let cY;

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
        if (item.preview) {
          item.preview.drawBg(MODE_HOVER);
        }
        render();
      }
    }
  };

  const handleHoverItemEnd = ({ item }) => {
    if (isFocus) {
      if (hoverItemContainer.children.length === 2)
        hoverItemContainer.removeChildAt(0);
      if (item.preview) {
        item.preview.drawBg();
      }
      render();
    }
  };

  const drawBorder = (size = 1, mode = '') => {
    // while positioning, do not draw border
    if (isPositioning) return;
    const rect = itemContainer.getBounds();

    if (graphics.scale.x !== 1) {
      rect.width /= graphics.scale.x;
      rect.height /= graphics.scale.x;
    }

    pubSub.publish('updateBBox', id);

    const state = store.getState();

    border.clear();

    // draw black background
    border.beginFill(state.pileBackgroundColor, state.pileBackgroundOpacity);
    border.drawRect(
      bBox.minX - graphics.x - size,
      bBox.minY - graphics.y - size,
      rect.width + 2 * size,
      rect.height + 2 * size
    );
    border.endFill();

    // draw border
    border.lineStyle(
      size,
      state[`pileBorderColor${mode}`],
      state[`pileBorderOpacity${mode}`]
    );
    border.drawRect(
      bBox.minX - graphics.x - size,
      bBox.minY - graphics.y - size,
      rect.width + 2 * size,
      rect.height + 2 * size
    );

    render();
  };

  const onPointerDown = () => {
    graphics.isPointerDown = true;
  };

  const onPointerUp = () => {
    graphics.isPointerDown = false;
  };

  const onPointerOver = event => {
    graphics.isHover = true;

    pubSub.publish('pileEnter', { pileId: id, event });

    if (isFocus) {
      if (isTempDepiled) {
        drawBorder(3, 'Active');
      } else {
        drawBorder(2, 'Selected');
      }
    } else {
      drawBorder();
    }
    // pubSub subscription for hoverItem
    if (!hoverItemSubscriber) {
      hoverItemSubscriber = pubSub.subscribe('itemOver', handleHoverItem);
      pubSubSubscribers.push(hoverItemSubscriber);
    }
    if (!hoverItemEndSubscriber) {
      hoverItemEndSubscriber = pubSub.subscribe('itemOut', handleHoverItemEnd);
      pubSubSubscribers.push(hoverItemEndSubscriber);
    }
  };

  const onPointerOut = event => {
    if (graphics.isDragging) return;
    graphics.isHover = false;

    pubSub.publish('pileLeave', { pileId: id, event });

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
    render();
  };

  let dragMove;

  const onDragStart = event => {
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
    dragMove = false;
    render();
  };

  const onDragEnd = event => {
    if (!graphics.isDragging) return;
    graphics.alpha = 1;
    graphics.isDragging = false;
    graphics.draggingMouseOffset = null;

    if (dragMove) {
      // trigger collision check
      pubSub.publish('pileDrop', { pileId: id, event });
    }

    render();
  };

  const onDragMove = event => {
    if (graphics.isDragging) {
      dragMove = true;

      pubSub.publish('pileDrag', { pileId: id, event });

      const newPosition = event.data.getLocalPosition(graphics.parent);
      // remove offset
      graphics.x = newPosition.x - graphics.draggingMouseOffset[0];
      graphics.y = newPosition.y - graphics.draggingMouseOffset[1];

      if (isTempDepiled) {
        drawBorder(3, MODE_ACTIVE);
      } else {
        drawBorder(2, MODE_SELECTED);
      }

      render();
    }
  };

  const setBBox = newBBox => {
    bBox.minX = newBBox.minX;
    bBox.minY = newBBox.minY;
    bBox.maxX = newBBox.maxX;
    bBox.maxY = newBBox.maxY;
    cX = bBox.minX + (bBox.maxX - bBox.minX) / 2;
    cY = bBox.minY + (bBox.maxY - bBox.minY) / 2;
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
        if (isLastOne) {
          isPositioning = false;
          pubSub.publish('updateBBox', id);
        }
      }
    });
    animator.add(tweener);
  };

  const positionItems = (itemAlignment, itemRotated, animator, spacing) => {
    isPositioning = true;
    if (hasCover) {
      // matrix
      itemContainer.children.forEach((item, index) => {
        if (index === itemContainer.children.length - 1) return;
        const padding = (item.height + spacing / 2) * (index + 1);
        if (index === itemContainer.children.length - 2)
          animatePositionItems(item, 2 - spacing / 2, -padding, animator, true);
        else
          animatePositionItems(
            item,
            2 - spacing / 2,
            -padding,
            animator,
            false
          );
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
        let paddingX;
        let paddingY;
        if (!Number.isNaN(+item.tmpAbsX) && !Number.isNaN(+item.tmpAbsY)) {
          paddingX = item.x + x;
          paddingY = item.y + y;
          item.x = item.x + item.tmpAbsX - graphics.x;
          item.y = item.y + item.tmpAbsY - graphics.y;
          item.tmpAbsX = undefined;
          item.tmpAbsY = undefined;
        } else {
          paddingX = getRandomArbitrary(-30, 30);
          paddingY = getRandomArbitrary(-30, 30);
        }
        itemsById.set(index, item);
        if (num === newItemsById.size)
          animatePositionItems(item, paddingX, paddingY, animator, true);
        else animatePositionItems(item, paddingX, paddingY, animator, false);
        if (rotation) {
          item.angle += rotation;
        }
      });
      newItemsById.clear();
    }
  };

  const getScale = () => graphics.scale.x;

  const setScale = scale => {
    graphics.scale.x = scale;
    graphics.scale.y = scale;
  };

  let scaleTweener;
  // eslint-disable-next-line consistent-return
  const scale = (newScale, noAnimate) => {
    if (Number.isNaN(+newScale)) return getScale();

    if (noAnimate) {
      setScale(newScale);
    }

    let duration = 250;
    if (scaleTweener) {
      pubSub.publish('cancelAnimation', scaleTweener);
      const Dt = scaleTweener.getDt();
      if (Dt < duration) {
        duration = Dt;
      }
    }
    scaleTweener = createTweener({
      duration,
      delay: 0,
      interpolator: interpolateNumber,
      endValue: newScale,
      getter: getScale,
      setter: setScale,
      onDone: () => {
        pubSub.publish('updateBBox', id);
      }
    });
    pubSub.publish('animate', scaleTweener);
  };

  const scaleByWheel = wheelDelta => {
    const force = Math.log(Math.abs(wheelDelta) + 1);
    const momentum = Math.sign(wheelDelta) * force;

    const oldScale = getScale();
    const newScale = Math.min(
      Math.max(1, oldScale * (1 + 0.075 * momentum)),
      MAX_SCALE
    );

    scale(newScale, true);

    return oldScale !== newScale;
  };

  let scaledUp = false;
  const scaleToggle = noAnimate => {
    scale(scaledUp ? 1 : MAX_SCALE, noAnimate);
    scaledUp = !scaledUp;
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

  const moveTo = (x, y) => {
    if (!Number.isNaN(+x) && !Number.isNaN(+y)) {
      graphics.x = x;
      graphics.y = y;
      updateBBox();
    }
  };

  init();

  return {
    // Properties
    get cX() {
      return cX;
    },
    get cY() {
      return cY;
    },
    get bBox() {
      return bBox;
    },
    get graphics() {
      return graphics;
    },
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
    get items() {
      return itemContainer.children;
    },
    get size() {
      return itemContainer.children.length;
    },
    get x() {
      return graphics.x;
    },
    get y() {
      return graphics.y;
    },
    // Methods
    animatePositionItems,
    border,
    calcBBox,
    cover,
    destroy,
    drawBorder,
    id,
    itemContainer,
    itemsById,
    moveTo,
    newItemsById,
    positionItems,
    scale,
    scaleByWheel,
    scaleToggle,
    updateBBox
  };
};

export default createPile;
