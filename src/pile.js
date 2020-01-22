import * as PIXI from 'pixi.js';

import createTweener from './tweener';
import { interpolateNumber, interpolateVector } from './utils';

export const MAX_SCALE = 3;
export const MODE_HOVER = Symbol('Hover');
export const MODE_FOCUS = Symbol('Focus');
export const MODE_ACTIVE = Symbol('Active');

const modeToString = new Map();
modeToString.set(MODE_HOVER, 'Hover');
modeToString.set(MODE_FOCUS, 'Focus');
modeToString.set(MODE_ACTIVE, 'Active');

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
  const items = [];
  const itemIndex = new Map();
  const newItems = new Set();
  const graphics = new PIXI.Graphics(); // Root graphics
  const itemContainer = new PIXI.Container();
  const hoverItemContainer = new PIXI.Container();
  const border = new PIXI.Graphics();
  const contentGraphics = new PIXI.Graphics();

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
  let isScaling = false;
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

  let borderSizeBase = 0;

  const drawBorder = (size = borderSizeBase, mode = '') => {
    border.clear();

    if (!size) return;

    if (isPositioning || isScaling) {
      // eslint-disable-next-line no-use-before-define
      postPilePositionAnimation.set('drawBorder', () => {
        drawBorder(size, mode);
      });
      return;
    }

    const borderBounds = border.getBounds();
    const contentBounds = contentGraphics.getBounds();

    pubSub.publish('updateBBox', id);

    const state = store.getState();

    const offset = Math.ceil(size / 2) + 1;

    // draw black background
    border.beginFill(state.pileBackgroundColor, state.pileBackgroundOpacity);
    border.drawRect(
      contentBounds.x - borderBounds.x - offset,
      contentBounds.y - borderBounds.y - offset,
      contentBounds.width + 2 * offset,
      contentBounds.height + 2 * offset
    );
    border.endFill();

    // draw border
    border.lineStyle(
      size,
      state[`pileBorderColor${modeToString.get(mode) || ''}`],
      state[`pileBorderOpacity${modeToString.get(mode) || ''}`]
    );
    border.drawRect(
      contentBounds.x - borderBounds.x - offset,
      contentBounds.y - borderBounds.y - offset,
      contentBounds.width + 2 * offset,
      contentBounds.height + 2 * offset
    );

    render();
  };

  const getBorderSize = () => borderSizeBase;
  const setBorderSize = newBorderSize => {
    borderSizeBase = +newBorderSize;
    // If the cover is not generated yet
    if (hasCover && !cover) {
      // eslint-disable-next-line no-use-before-define
      postPilePositionAnimation.set('drawBorder', () => {
        drawBorder();
      });
    } else {
      drawBorder();
    }
  };

  // eslint-disable-next-line consistent-return
  const borderSize = newBorderSize => {
    if (Number.isNaN(+newBorderSize)) return getBorderSize();

    setBorderSize(newBorderSize);
  };

  const blur = () => {
    drawBorder();
  };

  const hover = () => {
    drawBorder(borderSizeBase || 1, MODE_HOVER);
  };

  const focus = () => {
    drawBorder(borderSizeBase || 2, MODE_FOCUS);
  };

  const active = () => {
    drawBorder(borderSizeBase || 3, MODE_ACTIVE);
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
        active();
      } else {
        focus();
      }
    } else {
      hover();
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

    if (!isFocus) {
      blur();
    }

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
        active();
      } else {
        focus();
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

  // compute bounding box
  const calcBBox = () => {
    // eslint-disable-next-line no-use-before-define
    const scale = getScale();

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

  const getOpacity = () => graphics.alpha;
  const setOpacity = newOpacity => {
    graphics.alpha = newOpacity;
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

  // Map to store calls for after the pile position animation
  const postPilePositionAnimation = new Map();
  const animatePositionItems = (
    itemSprite,
    x,
    y,
    angle,
    animator,
    isLastOne
  ) => {
    const targetScale = itemSprite.tmpTargetScale || itemSprite.scale.x;
    itemSprite.tmpTargetScale = undefined;
    delete itemSprite.tmpTargetScale;

    const tweener = createTweener({
      duration: 250,
      interpolator: interpolateVector,
      endValue: [x, y, targetScale, angle],
      getter: () => {
        return [
          itemSprite.x,
          itemSprite.y,
          itemSprite.scale.x,
          itemSprite.angle
        ];
      },
      setter: newValue => {
        itemSprite.x = newValue[0];
        itemSprite.y = newValue[1];
        itemSprite.scale.x = newValue[2];
        itemSprite.scale.y = itemSprite.scale.x;
        itemSprite.angle = newValue[3];
      },
      onDone: () => {
        itemSprite.tmpTargetScale = undefined;
        if (isLastOne) {
          isPositioning = false;
          postPilePositionAnimation.forEach(fn => {
            fn();
          });
          postPilePositionAnimation.clear();
          pubSub.publish('updateBBox', id);
        }
      }
    });
    animator.add(tweener);
  };

  const positionItems = (
    itemAlignment,
    itemRotation,
    animator,
    previewSpacing
  ) => {
    isPositioning = true;
    let angle = 0;
    if (hasCover) {
      // matrix
      itemContainer.children.forEach((item, index) => {
        if (index === itemContainer.children.length - 1) return;

        const padding = (item.height + previewSpacing / 2) * (index + 1);

        animatePositionItems(
          item,
          -previewSpacing / 2,
          -padding,
          angle,
          animator,
          index === itemContainer.children.length - 2
        );
      });
    } else if (itemAlignment || items.length === 1) {
      // image
      newItems.forEach(item => {
        const sprite = item.sprite;

        // eslint-disable-next-line no-use-before-define
        const currentScale = getScale();
        let relItemScale = (item.tmpRelScale || 1) / currentScale;

        // When the scale of the source and target pile were different, we need
        // to equalize the scale.
        sprite.tmpTargetScale = sprite.scale.x;
        if (!Number.isNaN(+item.tmpRelScale)) {
          relItemScale = item.tmpRelScale / currentScale;
          sprite.scale.x *= relItemScale;
          sprite.scale.y = sprite.scale.x;
          item.tmpRelScale = undefined;
          delete item.tmpRelScale;
        }

        if (!Number.isNaN(+item.tmpAbsX) && !Number.isNaN(+item.tmpAbsY)) {
          item.moveTo(
            (item.x + item.tmpAbsX - graphics.x) / currentScale,
            (item.y + item.tmpAbsY - graphics.y) / currentScale
          );
          item.tmpAbsX = undefined;
          item.tmpAbsY = undefined;
          delete item.tmpAbsX;
          delete item.tmpAbsY;
        }
      });

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

        animatePositionItems(
          item,
          horizontalPadding,
          verticalPadding,
          angle,
          animator,
          index === itemContainer.children.length - 1
        );
      });
    } else {
      const { randomOffsetRange, randomRotationRange } = store.getState();
      let num = 0;
      newItems.forEach(item => {
        num++;

        const sprite = item.sprite;

        // eslint-disable-next-line no-use-before-define
        const currentScale = getScale();
        let relItemScale = (item.tmpRelScale || 1) / currentScale;

        sprite.tmpTargetScale = sprite.scale.x;
        if (!Number.isNaN(+item.tmpRelScale)) {
          relItemScale = item.tmpRelScale / currentScale;
          sprite.scale.x *= relItemScale;
          sprite.scale.y = sprite.scale.x;
          item.tmpRelScale = undefined;
          delete item.tmpRelScale;
        }

        let offsetX = getRandomArbitrary(...randomOffsetRange);
        let offsetY = getRandomArbitrary(...randomOffsetRange);

        if (!Number.isNaN(+item.tmpAbsX) && !Number.isNaN(+item.tmpAbsY)) {
          offsetX += item.x;
          offsetY += item.y;
          item.moveTo(
            (item.x + item.tmpAbsX - graphics.x) / currentScale,
            (item.y + item.tmpAbsY - graphics.y) / currentScale
          );
          item.tmpAbsX = undefined;
          item.tmpAbsY = undefined;
          delete item.tmpAbsX;
          delete item.tmpAbsY;
        }

        if (itemRotation) {
          angle = getRandomArbitrary(...randomRotationRange);
        }

        animatePositionItems(
          sprite,
          offsetX,
          offsetY,
          angle,
          animator,
          num === newItems.size
        );
      });
    }
    newItems.clear();
  };

  const getScale = () => contentGraphics.scale.x;

  const setScale = scale => {
    contentGraphics.scale.x = scale;
    contentGraphics.scale.y = scale;
  };

  let scaleTweener;
  // eslint-disable-next-line consistent-return
  const scale = (newScale, noAnimate) => {
    if (Number.isNaN(+newScale)) return getScale();

    if (noAnimate) {
      setScale(newScale);
    }

    isScaling = true;
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
        isScaling = false;
        postPilePositionAnimation.forEach(fn => {
          fn();
        });
        postPilePositionAnimation.clear();
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

  const scaleToggle = noAnimate => {
    scale(getScale() > 1 ? 1 : MAX_SCALE, noAnimate);
  };

  const moveTo = (x, y) => {
    if (!Number.isNaN(+x) && !Number.isNaN(+y)) {
      graphics.x = x;
      graphics.y = y;
      pubSub.publish('updateBBox', id);
    }
  };

  const hasItem = item => itemIndex.has(item.id);

  const addItem = item => {
    if (hasItem(item)) return;

    items.push(item);
    newItems.add(item);
    itemIndex.set(item.id, item);
    if (hasCover) {
      itemContainer.addChild(item.preview.previewContainer);
    } else {
      itemContainer.addChild(item.sprite);
    }
  };

  const removeItem = item => {
    const itemIdx = items.indexOf(item);

    if (itemIdx >= 0) {
      items.splice(itemIdx, 1);
      itemContainer.removeChildAt(itemIdx);
    }

    itemIndex.delete(item.id);
  };

  const removeItems = () => {
    itemContainer.removeChildren();
    items.splice(0, items.length);
    itemIndex.clear();
  };

  /**
   * Set the items to the given list of items.
   *
   * @description
   * This function performs a D3-like enter-update-exit strategy by adding new
   * items and removing items that were on the pile before but are not present
   * in `_items`
   *
   * @param  {array}  _items  List of items
   */
  const setItems = _items => {
    const outdatedItems = new Map(itemIndex);

    // Add new items
    _items.forEach(item => {
      if (hasItem(item)) {
        // Item already exists so we remove it from `oldItems`
        outdatedItems.delete(item.id);
      } else {
        // Add new items
        addItem(item);
      }
    });

    // Remove all the outdated items
    outdatedItems.forEach(item => {
      removeItem(item);
    });
  };

  const init = () => {
    graphics.addChild(border);
    graphics.addChild(contentGraphics);

    contentGraphics.addChild(itemContainer);
    contentGraphics.addChild(hoverItemContainer);

    graphics.interactive = true;
    graphics.buttonMode = true;

    graphics.x = 0;
    graphics.y = 0;

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

    itemContainer.addChild(initialItem.sprite);

    addItem(initialItem);
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
    get contentGraphics() {
      return contentGraphics;
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
      return [...items];
    },
    get size() {
      return items.length;
    },
    get x() {
      return graphics.x;
    },
    get y() {
      return graphics.y;
    },
    border,
    cover,
    id,
    itemContainer,
    // Methods
    blur,
    hover,
    focus,
    active,
    addItem,
    animatePositionItems,
    borderSize,
    calcBBox,
    destroy,
    drawBorder,
    hasItem,
    moveTo,
    opacity,
    positionItems,
    removeItems,
    scale,
    scaleByWheel,
    scaleToggle,
    setItems,
    updateBBox
  };
};

export default createPile;
