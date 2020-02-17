import {
  identity,
  interpolateNumber,
  interpolateVector,
  mergeMaps
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import createBBox from './bounding-box';
import createPileItem from './pile-item';
import createTweener from './tweener';
import { cloneSprite } from './utils';

import { INHERIT } from './defaults';

export const MAX_MAGNIFICATION = 3;
export const MODE_NORMAL = Symbol('Normal');
export const MODE_HOVER = Symbol('Hover');
export const MODE_FOCUS = Symbol('Focus');
export const MODE_ACTIVE = Symbol('Active');

const modeToString = new Map();
modeToString.set(MODE_NORMAL, '');
modeToString.set(MODE_HOVER, 'Hover');
modeToString.set(MODE_FOCUS, 'Focus');
modeToString.set(MODE_ACTIVE, 'Active');

/**
 * Factory function to create a pile
 * @param {object}   options - The options
 * @param {object}   options.initialItems - The initial set of item
 * @param {function} options.render - Render withRaf function
 * @param {number}   options.id - Pile identifier
 * @param {object}   options.pubSub - Local pubSub instance
 * @param {object}   options.store - Redux store
 */
const createPile = (
  { items: initialItems, render, id, pubSub, store },
  { x: initialX = 0, y: initialY = 0 } = {}
) => {
  const allItems = [];
  const normalItemIndex = new Map();
  const previewItemIndex = new Map();
  const newItems = new Set();
  const rootGraphics = new PIXI.Graphics();
  const borderGraphics = new PIXI.Graphics();
  const contentGraphics = new PIXI.Graphics();
  const normalItemContainer = new PIXI.Container();
  const previewItemContainer = new PIXI.Container();
  const coverItemContainer = new PIXI.Container();
  const hoverItemContainer = new PIXI.Container();
  const tempDepileContainer = new PIXI.Container();

  const createPileBBox = createBBox({ id });

  let bBox = {};
  let anchorBox = {};

  let coverItem;

  let isFocus = false;
  let isTempDepiled = false;
  let isPositioning = false;
  let isScaling = false;
  let isMoving = false;

  let mode = MODE_NORMAL;

  let baseScale = 1;
  let magnification = 1;

  const pubSubSubscribers = [];
  let hoverItemSubscriber;
  let hoverItemEndSubscriber;

  const destroy = () => {
    rootGraphics.destroy();
    pubSubSubscribers.forEach(subscriber => {
      pubSub.unsubscribe(subscriber);
    });
  };

  const clonePileItemSprite = pileItem => {
    const clonedSprite = cloneSprite(pileItem.item.image.displayObject);
    clonedSprite.x = coverItemContainer.x;
    clonedSprite.y = coverItemContainer.y;
    clonedSprite.angle = pileItem.displayObject.angle;

    return clonedSprite;
  };

  // eslint-disable-next-line no-shadow
  const itemOverHandler = ({ item }) => {
    if (isFocus) {
      if (!rootGraphics.isDragging) {
        const clonedSprite = clonePileItemSprite(item);
        hoverItemContainer.addChild(clonedSprite);
        if (hasPreviewItem(item)) {
          const { previewBorderColor, previewBorderOpacity } = store.getState();
          item.image.drawBackground(previewBorderColor, previewBorderOpacity);
        }
        render();
      }
    }
  };

  const itemOutHandler = ({ item }) => {
    if (isFocus) {
      if (hoverItemContainer.children.length === 2) {
        hoverItemContainer.removeChildAt(0);
      }
      if (hasPreviewItem(item)) {
        const {
          previewBackgroundColor,
          previewBackgroundOpacity,
          pileBackgroundColor,
          pileBackgroundOpacity
        } = store.getState();
        const backgroundColor =
          previewBackgroundColor === INHERIT
            ? pileBackgroundColor
            : previewBackgroundColor;
        const backgroundOpacity =
          previewBackgroundOpacity === INHERIT
            ? pileBackgroundOpacity
            : previewBackgroundOpacity;
        item.image.drawBackground(backgroundColor, backgroundOpacity);
      }
      render();
    }
  };

  let borderSizeBase = 0;

  const setBorderSize = newBorderSize => {
    borderSizeBase = +newBorderSize;

    if (getCover()) {
      // Wait until the cover is rendered
      getCover().then(() => {
        drawBorder();
      });
    } else {
      drawBorder();
    }
  };

  const getBorderSize = () => {
    switch (mode) {
      case MODE_HOVER:
      case MODE_FOCUS:
        return borderSizeBase || 1;

      case MODE_ACTIVE:
        return borderSizeBase || 2;

      case MODE_NORMAL:
      default:
        return borderSizeBase;
    }
  };

  const drawBorder = () => {
    const size = getBorderSize();

    if (!size) {
      borderGraphics.clear();
      return;
    }

    if (isPositioning || isScaling) {
      const currentMode = mode;
      postPilePositionAnimation.set('drawBorder', () => {
        drawBorder(size, currentMode);
      });
      return;
    }

    borderGraphics.clear();

    const borderBounds = borderGraphics.getBounds();
    const contentBounds = contentGraphics.getBounds();

    const state = store.getState();

    const offset = Math.ceil(size / 2) + 1;

    // draw black background
    borderGraphics.beginFill(
      state.pileBackgroundColor,
      state.pileBackgroundOpacity
    );
    borderGraphics.drawRect(
      contentBounds.x - borderBounds.x - offset,
      contentBounds.y - borderBounds.y - offset,
      contentBounds.width + 2 * offset,
      contentBounds.height + 2 * offset
    );
    borderGraphics.endFill();

    // draw border
    borderGraphics.lineStyle(
      size,
      state[`pileBorderColor${modeToString.get(mode) || ''}`],
      state[`pileBorderOpacity${modeToString.get(mode) || ''}`]
    );
    borderGraphics.drawRect(
      contentBounds.x - borderBounds.x - offset,
      contentBounds.y - borderBounds.y - offset,
      contentBounds.width + 2 * offset,
      contentBounds.height + 2 * offset
    );

    render();
  };

  // eslint-disable-next-line consistent-return
  const borderSize = newBorderSize => {
    if (Number.isNaN(+newBorderSize)) return getBorderSize();

    setBorderSize(newBorderSize);
  };

  const blur = () => {
    mode = MODE_NORMAL;
    drawBorder();
  };

  const hover = () => {
    if (mode === MODE_HOVER) return;
    mode = MODE_HOVER;
    drawBorder();
  };

  const focus = () => {
    if (mode === MODE_FOCUS) return;
    mode = MODE_FOCUS;
    drawBorder();
  };

  const active = () => {
    if (mode === MODE_ACTIVE) return;
    mode = MODE_ACTIVE;
    drawBorder();
  };

  const onPointerDown = () => {
    rootGraphics.isPointerDown = true;
  };

  const onPointerUp = () => {
    rootGraphics.isPointerDown = false;
  };

  const onPointerOver = event => {
    rootGraphics.isHover = true;

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
      hoverItemSubscriber = pubSub.subscribe('itemOver', itemOverHandler);
      pubSubSubscribers.push(hoverItemSubscriber);
    }
    if (!hoverItemEndSubscriber) {
      hoverItemEndSubscriber = pubSub.subscribe('itemOut', itemOutHandler);
      pubSubSubscribers.push(hoverItemEndSubscriber);
    }
  };

  const onPointerOut = event => {
    if (rootGraphics.isDragging) return;
    rootGraphics.isHover = false;

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
    rootGraphics.draggingMouseOffset = [
      event.data.getLocalPosition(rootGraphics.parent).x - rootGraphics.x,
      event.data.getLocalPosition(rootGraphics.parent).y - rootGraphics.y
    ];
    rootGraphics.alpha = 1;
    rootGraphics.isDragging = true;
    rootGraphics.beforeDragX = rootGraphics.x;
    rootGraphics.beforeDragY = rootGraphics.y;
    dragMove = false;

    pubSub.publish('pileDragStart', { pileId: id, event });

    render();
  };

  const onDragEnd = event => {
    if (!rootGraphics.isDragging) return;
    rootGraphics.alpha = 1;
    rootGraphics.isDragging = false;
    rootGraphics.draggingMouseOffset = null;

    if (dragMove) {
      pubSub.publish('updatePileBounds', id);
      pubSub.publish('pileDragEnd', { pileId: id, event });
    }

    render();
  };

  const onDragMove = event => {
    if (rootGraphics.isDragging) {
      dragMove = true;

      pubSub.publish('pileDragMove', { pileId: id, event });

      let { x, y } = event.data.getLocalPosition(rootGraphics.parent);
      x -= rootGraphics.draggingMouseOffset[0];
      y -= rootGraphics.draggingMouseOffset[1];

      if (isMoving) {
        moveToTweener.updateEndValue([x, y]);
      } else {
        rootGraphics.x = x;
        rootGraphics.y = y;
      }

      if (isTempDepiled) {
        active();
      } else {
        hover();
      }

      render();
    }
  };

  /**
   * Calculate the current anchor box of the pile
   * @return  {object}  Anchor bounding box
   */
  const calcAnchorBox = () => {
    const bounds = coverItemContainer.children.length
      ? coverItemContainer.getBounds()
      : normalItemContainer.getBounds();

    return createPileBBox({
      minX: bounds.x,
      minY: bounds.y,
      maxX: bounds.x + bounds.width,
      maxY: bounds.y + bounds.height
    });
  };

  const updateAnchorBox = () => {
    anchorBox = calcAnchorBox();
  };

  /**
   * Compute the current bounding box of the pile
   * @return  {object}  Pile bounding box
   */
  const calcBBox = () => {
    const bounds = rootGraphics.getBounds();

    return createPileBBox({
      minX: bounds.x,
      minY: bounds.y,
      maxX: bounds.x + bounds.width,
      maxY: bounds.y + bounds.height
    });
  };

  const updateBBox = () => {
    bBox = calcBBox();
  };

  const updateBounds = () => {
    updateAnchorBox();
    updateBBox();
  };

  const getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
  };

  const getOpacity = () => rootGraphics.alpha;
  const setOpacity = newOpacity => {
    rootGraphics.alpha = newOpacity;
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
      if (opacityTweener.dt < opacityTweener.duration) {
        duration = opacityTweener.dt;
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
    pubSub.publish('startAnimation', opacityTweener);
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
          drawBorder();
          postPilePositionAnimation.forEach(fn => {
            fn();
          });
          postPilePositionAnimation.clear();
          pubSub.publish('updatePileBounds', id);
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
    if (getCover()) {
      getCover().then(coverImage => {
        const halfSpacing = previewSpacing / 2;
        const halfHeight = coverImage.height / 2;

        previewItemContainer.children.forEach((item, index) => {
          animatePositionItems(
            item,
            0,
            -halfHeight - item.height * (index + 0.5) - halfSpacing,
            angle,
            animator,
            index === previewItemContainer.children.length - 1
          );
        });
      });
    } else if (itemAlignment || allItems.length === 1) {
      // image
      newItems.forEach(pileItem => {
        const item = pileItem.item;
        const displayObject = pileItem.displayObject;

        // eslint-disable-next-line no-use-before-define
        const currentScale = getScale();

        // When the scale of the source and target pile were different, we need
        // to equalize the scale.
        displayObject.tmpTargetScale = displayObject.scale.x;
        if (!Number.isNaN(+item.tmpRelScale)) {
          const relItemScale = item.tmpRelScale / currentScale;
          displayObject.scale.x *= relItemScale;
          displayObject.scale.y = displayObject.scale.x;
          delete item.tmpRelScale;
        }

        if (!Number.isNaN(+item.tmpAbsX) && !Number.isNaN(+item.tmpAbsY)) {
          pileItem.moveTo(
            (pileItem.x + item.tmpAbsX - rootGraphics.x) / currentScale,
            (pileItem.y + item.tmpAbsY - rootGraphics.y) / currentScale
          );
          delete item.tmpAbsX;
          delete item.tmpAbsY;
        }
      });

      normalItemContainer.children.forEach((item, index) => {
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
            case 'overlap':
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
          index === normalItemContainer.children.length - 1
        );
      });
    } else {
      const { randomOffsetRange, randomRotationRange } = store.getState();
      let num = 0;
      newItems.forEach(pileItem => {
        num++;

        const item = pileItem.item;
        const displayObject = pileItem.displayObject;

        // eslint-disable-next-line no-use-before-define
        const currentScale = getScale();

        displayObject.tmpTargetScale = displayObject.scale.x;
        if (!Number.isNaN(+item.tmpRelScale)) {
          const relItemScale = item.tmpRelScale / currentScale;
          displayObject.scale.x *= relItemScale;
          displayObject.scale.y = displayObject.scale.x;
          delete item.tmpRelScale;
        }

        let offsetX = getRandomArbitrary(...randomOffsetRange);
        let offsetY = getRandomArbitrary(...randomOffsetRange);

        if (!Number.isNaN(+item.tmpAbsX) && !Number.isNaN(+item.tmpAbsY)) {
          offsetX += pileItem.x;
          offsetY += pileItem.y;
          pileItem.moveTo(
            (pileItem.x + item.tmpAbsX - rootGraphics.x) / currentScale,
            (pileItem.y + item.tmpAbsY - rootGraphics.y) / currentScale
          );
          delete item.tmpAbsX;
          delete item.tmpAbsY;
        }

        if (itemRotation) {
          angle = getRandomArbitrary(...randomRotationRange);
        }

        animatePositionItems(
          displayObject,
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

  const setScale = (newScale, { isMagnification = false } = {}) => {
    if (!isMagnification) baseScale = newScale;

    contentGraphics.scale.x = newScale;
    contentGraphics.scale.y = newScale;
  };

  let scaleTweener;
  const animateScale = (
    newScale,
    { isMagnification = false, onDone = identity } = {}
  ) => {
    if (!isMagnification) {
      baseScale = newScale;
    }

    isScaling = true;
    let duration = 250;
    if (scaleTweener) {
      pubSub.publish('cancelAnimation', scaleTweener);
      if (scaleTweener.dt < scaleTweener.duration) {
        duration = scaleTweener.dt;
      }
    }
    scaleTweener = createTweener({
      duration,
      delay: 0,
      interpolator: interpolateNumber,
      endValue: newScale,
      getter: getScale,
      setter: v => {
        setScale(v, { isMagnification });
      },
      onDone: () => {
        isScaling = false;
        drawBorder();
        postPilePositionAnimation.forEach(fn => {
          fn();
        });
        postPilePositionAnimation.clear();
        pubSub.publish('updatePileBounds', id);
        onDone();
      }
    });
    pubSub.publish('startAnimation', scaleTweener);
  };

  const magnifyByWheel = wheelDelta => {
    const force = Math.log(Math.abs(wheelDelta) + 1);
    const momentum = Math.sign(wheelDelta) * force;

    const currentScale = getScale();
    const newScale = Math.min(
      Math.max(1, currentScale * (1 + 0.075 * momentum)),
      baseScale * MAX_MAGNIFICATION
    );

    magnification = newScale / baseScale;

    setScale(newScale, { isMagnification: true });

    return currentScale !== newScale;
  };

  const magnify = () => {
    magnification = MAX_MAGNIFICATION;
    animateScale(baseScale * MAX_MAGNIFICATION, { isMagnification: true });
  };

  const unmagnify = () => {
    magnification = 1;
    animateScale(baseScale, { isMagnification: true });
  };

  let moveToTweener;
  const animateMoveTo = (x, y, { onDone = identity } = {}) => {
    isMoving = true;
    let duration = 250;
    if (moveToTweener) {
      pubSub.publish('cancelAnimation', moveToTweener);
      if (moveToTweener.dt < moveToTweener.duration) {
        duration = moveToTweener.dt;
      }
    }
    moveToTweener = createTweener({
      duration,
      delay: 0,
      interpolator: interpolateVector,
      endValue: [x, y],
      getter: () => [rootGraphics.x, rootGraphics.y],
      setter: xy => moveTo(xy[0], xy[1]),
      onDone: () => {
        isMoving = false;
        pubSub.publish('updatePileBounds', id);
        onDone();
      }
    });
    pubSub.publish('startAnimation', moveToTweener);
  };

  const moveTo = (x, y) => {
    rootGraphics.x = x;
    rootGraphics.y = y;
  };

  const getItemById = itemId =>
    normalItemIndex.get(itemId) || previewItemIndex.get(itemId);

  const hasNormalItem = item => normalItemIndex.has(item.id);
  const hasPreviewItem = item => previewItemIndex.has(item.id);

  const hasItem = (item, { asPreview = null } = {}) => {
    if (asPreview === false) return hasNormalItem(item);
    if (asPreview === true) return hasPreviewItem(item);
    return hasNormalItem(item) || hasPreviewItem(item);
  };

  const updateItemToNormal = item => {
    if (hasItem(item, { asPreview: false })) return;
    const currentItem = getItemById(item.id);
    const normalItem = createPileItem({ image: item.image, item, pubSub });

    // Update the `allItems` array
    const index = allItems.indexOf(currentItem);
    allItems.splice(index, 1, normalItem);

    // Update the indices
    previewItemIndex.delete(item.id);
    normalItemIndex.set(item.id, normalItem);

    // Update the PIXI containers
    previewItemContainer.removeChildAt(
      previewItemContainer.getChildIndex(currentItem.displayObject)
    );
    normalItemContainer.addChild(normalItem.displayObject);
  };

  const updateItemToPreview = item => {
    if (hasItem(item, { asPreview: true })) return;
    const currentItem = getItemById(item.id);
    const previewItem = createPileItem({ image: item.preview, item, pubSub });

    // Update the `allItems` array
    const index = allItems.indexOf(currentItem);
    allItems.splice(index, 1, previewItem);

    // Update the indices
    normalItemIndex.delete(item.id);
    previewItemIndex.set(item.id, previewItem);

    // Update the PIXI containers
    normalItemContainer.removeChildAt(
      normalItemContainer.getChildIndex(currentItem.displayObject)
    );
    previewItemContainer.addChild(previewItem.displayObject);
  };

  const updateItem = (item, { asPreview = false } = {}) => {
    if (asPreview === true) updateItemToPreview(item);
    else updateItemToNormal(item);
  };

  const addNormalItem = item => {
    const normalItem = createPileItem({
      image: item.image,
      item,
      pubSub
    });
    allItems.push(normalItem);
    newItems.add(normalItem);
    normalItemIndex.set(normalItem.id, normalItem);
    normalItemContainer.addChild(normalItem.displayObject);
  };

  const addPreviewItem = item => {
    const previewItem = createPileItem({
      image: item.preview,
      item,
      pubSub
    });
    allItems.push(previewItem);
    newItems.add(previewItem);
    previewItemIndex.set(previewItem.id, previewItem);
    previewItemContainer.addChild(previewItem.displayObject);
  };

  const addItem = (item, { asPreview = false } = {}) => {
    if (hasItem(item)) {
      if (hasItem(item, { asPreview: !asPreview })) {
        updateItem(item, { asPreview });
      }
      return;
    }

    if (asPreview) {
      addPreviewItem(item);
    } else {
      addNormalItem(item);
    }
  };

  const removeItem = item => {
    const pileItem = getItemById(item.id);

    // Remove from the `allItems` array
    const itemIdx = allItems.indexOf(pileItem);
    if (itemIdx >= 0) allItems.splice(itemIdx, 1);

    // Remove from the container
    if (hasItem(item, { asPreview: false })) {
      normalItemContainer.removeChildAt(
        normalItemContainer.getChildIndex(pileItem.displayObject)
      );
    }
    if (hasItem(item, { asPreview: true })) {
      previewItemContainer.removeChildAt(
        previewItemContainer.getChildIndex(pileItem.displayObject)
      );
    }

    // Delete the index
    normalItemIndex.delete(item.id);
    previewItemIndex.delete(item.id);
  };

  const removeAllItems = () => {
    normalItemContainer.removeChildren();
    previewItemContainer.removeChildren();
    allItems.splice(0, allItems.length);
    normalItemIndex.clear();
    previewItemIndex.clear();
  };

  /**
   * Set the items to the given list of items.
   *
   * @description
   * This function performs a D3-like enter-update-exit strategy by adding new
   * items and removing items that were on the pile before but are not present
   * in `items`
   *
   * @param  {array}  items  List of items
   */
  const setItems = (items, { asPreview = false } = {}) => {
    const outdatedItems = mergeMaps(normalItemIndex, previewItemIndex);

    // Add new items
    items.forEach(item => {
      if (hasItem(item)) {
        // Item already exists so we remove it from `oldItems`
        outdatedItems.delete(item.id);
        updateItem(item, { asPreview });
      } else {
        // Add new items
        addItem(item, { asPreview });
      }
    });

    // Remove all the outdated items
    outdatedItems.forEach(item => {
      removeItem(item);
    });
  };

  const getCover = () => coverItem;

  const setCover = newCover => {
    coverItem = newCover;
    coverItem.then(coverImage => {
      coverItemContainer.addChild(coverImage.displayObject);
      while (coverItemContainer.children.length > 1) {
        coverItemContainer.removeChildAt(0);
      }
    });
  };

  const removeCover = () => {
    if (!coverItem) return;

    coverItem.then(coverImage => {
      const coverItemIdx = coverItemContainer.getChildIndex(
        coverImage.displayObject
      );
      if (coverItemIdx >= 0) coverItemContainer.removeChildAt(coverItemIdx);
    });

    coverItem = undefined;
  };

  const updateCover = () => {
    if (!coverItem) return;

    coverItem.then(coverImage => {
      const cover = coverImage.displayObject;
      const coverRatio = cover.height / cover.width;
      cover.width =
        previewItemContainer.width - store.getState().previewSpacing;
      cover.height = coverRatio * cover.width;
    });
  };

  // eslint-disable-next-line consistent-return
  const cover = newCover => {
    if (typeof newCover === 'undefined') return getCover();
    if (newCover === null) return removeCover();
    setCover(newCover);
  };

  const init = () => {
    rootGraphics.addChild(borderGraphics);
    rootGraphics.addChild(contentGraphics);

    contentGraphics.addChild(normalItemContainer);
    contentGraphics.addChild(previewItemContainer);
    contentGraphics.addChild(coverItemContainer);
    contentGraphics.addChild(hoverItemContainer);
    contentGraphics.addChild(tempDepileContainer);

    rootGraphics.interactive = true;
    rootGraphics.buttonMode = true;
    rootGraphics.x = initialX;
    rootGraphics.y = initialY;

    tempDepileContainer.interactive = true;

    rootGraphics
      .on('pointerdown', onPointerDown)
      .on('pointerup', onPointerUp)
      .on('pointerupoutside', onPointerUp)
      .on('pointerover', onPointerOver)
      .on('pointerout', onPointerOut);

    rootGraphics
      .on('pointerdown', onDragStart)
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      .on('pointermove', onDragMove);

    setItems(initialItems);
  };

  init();

  return {
    // Properties
    get anchorBox() {
      return anchorBox;
    },
    get baseScale() {
      return baseScale;
    },
    get bBox() {
      return bBox;
    },
    get graphics() {
      return rootGraphics;
    },
    get contentGraphics() {
      return contentGraphics;
    },
    get isFocus() {
      return isFocus;
    },
    set isFocus(newIsFocus) {
      isFocus = !!newIsFocus;
    },
    get isMagnified() {
      return magnification > 1;
    },
    get isTempDepiled() {
      return isTempDepiled;
    },
    set isTempDepiled(newIsTempDepiled) {
      isTempDepiled = !!newIsTempDepiled;
    },
    get normalItemContainer() {
      return normalItemContainer;
    },
    get previewItemContainer() {
      return previewItemContainer;
    },
    get items() {
      return [...allItems];
    },
    get magnification() {
      return magnification;
    },
    get size() {
      return allItems.length;
    },
    get tempDepileContainer() {
      return tempDepileContainer;
    },
    get x() {
      return rootGraphics.x;
    },
    get y() {
      return rootGraphics.y;
    },
    borderGraphics,
    id,
    // Methods
    animateScale,
    animateMoveTo,
    blur,
    cover,
    hover,
    focus,
    active,
    addItem,
    animatePositionItems,
    borderSize,
    calcBBox,
    destroy,
    drawBorder,
    getItemById,
    hasItem,
    moveTo,
    opacity,
    positionItems,
    removeAllItems,
    setScale,
    magnifyByWheel,
    magnify,
    setItems,
    updateBounds,
    updateCover,
    unmagnify
  };
};

export default createPile;
