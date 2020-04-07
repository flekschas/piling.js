import {
  cubicOut,
  interpolateNumber,
  interpolateVector,
  isClose,
  isFunction,
  l2PointDist,
  mergeMaps,
  toVoid
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import createBBox from './bounding-box';
import createPileItem from './pile-item';
import createTweener from './tweener';
import {
  cloneSprite,
  colorToDecAlpha,
  getItemProp,
  getPileProp
} from './utils';

import { BLACK, INHERIT, WHITE } from './defaults';

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

const alignToXMod = align => {
  switch (align) {
    case 'left':
      return 0;

    case 'right':
      return 1;

    default:
      return 0.5;
  }
};

const alignToYMod = align => {
  switch (align) {
    case 'top':
      return 0;

    case 'bottom':
      return 1;

    default:
      return 0.5;
  }
};

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
  { render, id, pubSub, store, badgeFactory },
  { x: initialX = 0, y: initialY = 0 } = {}
) => {
  const allItems = [];
  const normalItemIndex = new Map();
  const previewItemIndex = new Map();
  const normalItemIdIndex = new Map();
  const previewItemIdIndex = new Map();
  const newItems = new Set();
  const rootGraphics = new PIXI.Graphics();
  const borderGraphics = new PIXI.Graphics();
  const contentGraphics = new PIXI.Graphics();
  const borderedContentContainer = new PIXI.Container();
  const normalItemContainer = new PIXI.Container();
  const previewItemContainer = new PIXI.Container();
  const coverContainer = new PIXI.Container();
  const hoverItemContainer = new PIXI.Container();
  const tempDepileContainer = new PIXI.Container();
  const hoverPreviewContainer = new PIXI.Container();

  const createPileBBox = createBBox({ id });

  let bBox = createPileBBox();
  let anchorBox = createPileBBox();

  let cover;
  let whenCover;

  let isFocus = false;
  let isTempDepiled = false;
  let isPositioning = false;
  let isScaling = false;
  let isMoving = false;

  let baseOffsetRelatedScaleFactor = -1;
  let baseOffset = [0, 0];

  let mode = MODE_NORMAL;

  let baseScale = 1;
  let magnification = 1;

  const pubSubSubscribers = [];
  let hoverItemSubscriber;
  let hoverItemEndSubscriber;

  const destroy = () => {
    if (previousSizeBadge) previousSizeBadge.destroy();
    rootGraphics.destroy();
    pubSubSubscribers.forEach(subscriber => {
      pubSub.unsubscribe(subscriber);
    });
  };

  const clonePileItemSprite = pileItem => {
    const clonedSprite = cloneSprite(pileItem.item.image.displayObject);
    if (cover) {
      clonedSprite.x = coverContainer.x;
      clonedSprite.y = coverContainer.y;
    } else {
      clonedSprite.x = pileItem.displayObject.x;
      clonedSprite.y = pileItem.displayObject.y;
    }
    clonedSprite.angle = pileItem.displayObject.angle;

    return clonedSprite;
  };

  // eslint-disable-next-line no-shadow
  const itemOverHandler = ({ item }) => {
    if (isFocus) {
      if (!rootGraphics.isDragging) {
        const clonedSprite = clonePileItemSprite(item);
        hoverItemContainer.addChild(clonedSprite);
        coverContainer.visible = false;
        if (hasPreviewItem(item)) {
          const {
            previewBorderColor,
            previewBorderOpacity,
            items
          } = store.state;
          const index = allItems.indexOf(item);
          const borderColor = getItemProp(
            previewBorderColor,
            items[item.id],
            index
          );
          const borderOpacity = getItemProp(
            previewBorderOpacity,
            items[item.id],
            index
          );

          getForegroundColor(borderColor);
          item.image.drawBackground(
            getForegroundColor(borderColor),
            borderOpacity,
            true
          );
          hoverPreviewContainer.addChild(item.displayObject);
        }
        render();
      }
    }
  };

  const getBackgroundColor = () => {
    const { pileBackgroundColor, piles, darkMode } = store.state;
    const backgroundColor = getPileProp(pileBackgroundColor, piles[id]);
    if (backgroundColor !== null) return backgroundColor;
    return darkMode ? BLACK : WHITE;
  };

  const getForegroundColor = color => {
    if (color !== null) return color;
    return store.state.darkMode ? WHITE : BLACK;
  };

  const itemOutHandler = ({ item }) => {
    if (isFocus) {
      coverContainer.visible = true;
      if (hoverItemContainer.children.length === 1) {
        hoverItemContainer.removeChildAt(0);
      }
      if (hasPreviewItem(item)) {
        const {
          previewBackgroundColor,
          previewBackgroundOpacity,
          pileBackgroundOpacity,
          items,
          piles
        } = store.state;
        const index = allItems.indexOf(item);

        const pileBackgroundColor = getBackgroundColor();

        const backgroundColor =
          previewBackgroundColor === INHERIT
            ? pileBackgroundColor
            : getItemProp(previewBackgroundColor, items[item.id], index);
        const backgroundOpacity =
          previewBackgroundOpacity === INHERIT
            ? getPileProp(pileBackgroundOpacity, piles[id])
            : getItemProp(previewBackgroundOpacity, items[item.id], index);
        item.image.drawBackground(backgroundColor, backgroundOpacity);
        previewItemContainer.addChild(item.displayObject);
      }
      render();
    }
  };

  let pileBounds = { drawCall: -1 };
  let borderDrawCall = 0;
  const getContentBounds = () => {
    if (pileBounds.drawCall === borderDrawCall) return pileBounds;

    const borderBounds = borderGraphics.getBounds();
    const contentBounds = contentGraphics.getBounds();

    pileBounds = {
      drawCall: borderDrawCall,
      x: contentBounds.x - borderBounds.x,
      y: contentBounds.y - borderBounds.y,
      width: contentBounds.width,
      height: contentBounds.height
    };

    return pileBounds;
  };

  let previousSize;
  let previousSizeBadge;
  const drawSizeBadge = () => {
    if (isPositioning) return;

    const { darkMode, piles, pileSizeBadgeAlign } = store.state;
    const [yAlign, xAlign] = isFunction(pileSizeBadgeAlign)
      ? pileSizeBadgeAlign(piles[id])
      : pileSizeBadgeAlign;
    const xMod = alignToXMod(xAlign);
    const yMod = alignToYMod(yAlign);

    const size = allItems.length;
    const newBadge = size !== previousSize;

    let sizeBadge = previousSizeBadge;

    if (newBadge) {
      sizeBadge = badgeFactory.create(size, { darkMode });

      if (previousSize !== undefined) {
        rootGraphics.removeChild(previousSizeBadge.displayObject);
        previousSizeBadge.destroy();
      }
    }

    if (
      !normalItemContainer.children.length &&
      !coverContainer.children.length
    ) {
      return;
    }

    const bounds = getContentBounds();

    sizeBadge.displayObject.x =
      bounds.x - borderSizeBase + (bounds.width + 2 * borderSizeBase) * xMod;
    sizeBadge.displayObject.y =
      bounds.y - borderSizeBase + (bounds.height + 2 * borderSizeBase) * yMod;

    if (newBadge) rootGraphics.addChild(sizeBadge.displayObject);

    previousSizeBadge = sizeBadge;
    previousSize = size;

    render();
  };

  let isShowSizeBadge = false;
  const showSizeBadge = show => {
    isShowSizeBadge = show;
    if (isShowSizeBadge) {
      drawSizeBadge();
    } else if (previousSizeBadge) {
      rootGraphics.removeChild(previousSizeBadge.displayObject);
      previousSizeBadge.destroy();
      previousSize = undefined;
    }
  };

  let borderSizeBase = 0;

  const setBorderSize = newBorderSize => {
    borderSizeBase = +newBorderSize;

    drawBorder();

    if (whenCover) {
      // Wait until the cover is rendered
      whenCover.then(() => {
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

  const getBackgroundOpacity = () => {
    const { pileBackgroundOpacityHover, piles } = store.state;

    let backgroundOpacity = getPileProp(
      store.state[`pileBackgroundOpacity${modeToString.get(mode) || ''}`],
      piles[id]
    );

    if (backgroundOpacity === null)
      backgroundOpacity = getPileProp(pileBackgroundOpacityHover, piles[id]);

    return backgroundOpacity;
  };

  const drawBorder = () => {
    ++borderDrawCall;
    const size = getBorderSize();
    const backgroundOpacity = getBackgroundOpacity();

    if (!size && !backgroundOpacity) {
      borderGraphics.clear();
      return;
    }

    if (isPositioning) {
      const currentMode = mode;
      postPilePositionAnimation.set('drawBorder', () => {
        drawBorder(size, currentMode);
      });
      return;
    }

    borderGraphics.clear();

    const bounds = getContentBounds();

    const state = store.state;

    const borderOffset = Math.ceil(size / 2);
    const backgroundColor =
      getPileProp(
        state[`pileBackgroundColor${modeToString.get(mode) || ''}`],
        state.piles[id]
      ) || getBackgroundColor();

    // draw black background
    borderGraphics.beginFill(backgroundColor, backgroundOpacity);
    borderGraphics.drawRect(
      bounds.x - borderOffset,
      bounds.y - borderOffset,
      bounds.width + 2 * borderOffset,
      bounds.height + 2 * borderOffset
    );
    borderGraphics.endFill();

    let color = state[`pileBorderColor${modeToString.get(mode) || ''}`];
    const opacity = getPileProp(
      state[`pileBorderOpacity${modeToString.get(mode) || ''}`],
      state.piles[id]
    );

    color = isFunction(color)
      ? colorToDecAlpha(color(state.piles[id]))[0]
      : color;

    // draw border
    borderGraphics.lineStyle(size, color, opacity);
    borderGraphics.drawRect(
      bounds.x - borderOffset,
      bounds.y - borderOffset,
      bounds.width + 2 * borderOffset,
      bounds.height + 2 * borderOffset
    );

    if (isShowSizeBadge) drawSizeBadge();

    render();
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

    pubSub.publish('pileEnter', { target: store.state.piles[id], event });

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

    pubSub.publish('pileLeave', { target: store.state.piles[id], event });

    if (!isFocus) blur();

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
    if (event.data.button === 2) return;

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

    pubSub.publish('pileDragStart', { target: store.state.piles[id], event });
  };

  const onDragEnd = event => {
    if (event.data.button === 2) return;

    if (!rootGraphics.isDragging) return;
    rootGraphics.alpha = 1;
    rootGraphics.isDragging = false;
    rootGraphics.draggingMouseOffset = null;

    if (dragMove) {
      pubSub.publish('pileDragEnd', { target: store.state.piles[id], event });
    }
  };

  const onDragMove = event => {
    if (event.data.button === 2) return;

    if (rootGraphics.isDragging) {
      dragMove = true;

      pubSub.publish('pileDragMove', { target: store.state.piles[id], event });

      let { x, y } = event.data.getLocalPosition(rootGraphics.parent);
      x -= rootGraphics.draggingMouseOffset[0];
      y -= rootGraphics.draggingMouseOffset[1];

      const size = getBorderSize();

      if (size % 2 === 1) {
        x = Math.floor(x) + 0.5;
        y = Math.floor(y) + 0.5;
      }

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
  const calcAnchorBox = (xOffset = 0, yOffset = 0) => {
    let bounds;
    let localXOffset = 0;
    let localYOffset = 0;

    if (coverContainer.children.length) {
      bounds = coverContainer.getBounds();
    } else {
      bounds = normalItemContainer.getBounds();
      if (allItems.length > 1) {
        const firstItemBounds = allItems[0].displayObject.getBounds();
        localXOffset = bounds.x - firstItemBounds.x;
        localYOffset = bounds.y - firstItemBounds.y;
      }
    }

    return createPileBBox({
      localXOffset,
      localYOffset,
      minX: bounds.x - xOffset,
      minY: bounds.y - yOffset,
      maxX: bounds.x + bounds.width - xOffset,
      maxY: bounds.y + bounds.height - yOffset
    });
  };

  const updateAnchorBox = (xOffset, yOffset) => {
    anchorBox = calcAnchorBox(xOffset, yOffset);
  };

  /**
   * Compute the current bounding box of the pile
   * @return  {object}  Pile bounding box
   */
  const calcBBox = (xOffset = 0, yOffset = 0) => {
    const bounds = borderedContentContainer.getBounds();

    return createPileBBox({
      minX: bounds.x - xOffset,
      minY: bounds.y - yOffset,
      maxX: bounds.x + bounds.width - xOffset,
      maxY: bounds.y + bounds.height - yOffset
    });
  };

  const updateBBox = (xOffset, yOffset) => {
    bBox = calcBBox(xOffset, yOffset);
  };

  const updateBounds = (xOffset, yOffset) => {
    updateAnchorBox(xOffset, yOffset);
    updateBBox(xOffset, yOffset);
  };

  const getOpacity = () => rootGraphics.alpha;
  const setOpacity = newOpacity => {
    rootGraphics.alpha = newOpacity;
  };

  let opacityTweener;
  // eslint-disable-next-line consistent-return
  const animateOpacity = newOpacity => {
    const d = Math.abs(newOpacity - getOpacity());

    if (d < 1 / 100) {
      setOpacity(newOpacity);
      return;
    }

    let duration = cubicOut(d) * 250;
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

  const setVisibilityItems = visibility => {
    normalItemContainer.visible = visibility;
    previewItemContainer.visible = visibility;
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
          drawLabel();
          postPilePositionAnimation.forEach(fn => {
            fn();
          });
          postPilePositionAnimation.clear();
          pubSub.publish('updatePileBounds', id);
          if (isPlaceholderDrawn) removePlaceholder();
        }
      }
    });
    animator.add(tweener);
  };

  const setItemOrder = itemIdsMap => {
    const sortFunc = index => (a, b) => {
      const id1 = index.get(a);
      const id2 = index.get(b);
      return itemIdsMap.get(id1) - itemIdsMap.get(id2);
    };

    normalItemContainer.children.sort(sortFunc(normalItemIdIndex));
    previewItemContainer.children.sort(sortFunc(previewItemIdIndex));
    allItems.sort((a, b) => itemIdsMap.get(a.id) - itemIdsMap.get(b.id));
  };

  const positionPreviews = animator => {
    const {
      piles,
      previewItemOffset,
      previewOffset,
      previewSpacing
    } = store.state;
    const pileState = piles[id];

    whenCover.then(_cover => {
      const spacing = isFunction(previewSpacing)
        ? previewSpacing(pileState)
        : previewSpacing;

      let offset = isFunction(previewOffset)
        ? previewOffset(pileState)
        : previewOffset;

      offset = offset !== null ? offset : spacing / 2;

      const halfSpacing = spacing / 2;
      const halfWidth = _cover.width / 2;
      const halfHeight = _cover.height / 2;

      isPositioning = previewItemContainer.children > 0;

      previewItemContainer.children.forEach((previewItem, index) => {
        // eslint-disable-next-line no-underscore-dangle
        const item = previewItem.__pilingjs__item;
        const itemState = store.state.items[item.id];

        let itemOffset;

        if (isFunction(previewItemOffset)) {
          itemOffset = previewItemOffset(itemState, index, pileState);
          itemOffset[0] = itemOffset[0] * _cover.scaleFactor - halfWidth;
          itemOffset[1] = itemOffset[1] * _cover.scaleFactor - halfHeight;
        } else {
          itemOffset = [
            0,
            -halfHeight -
              item.preview.height * (index + 0.5) -
              halfSpacing * index -
              offset
          ];
        }

        item.preview.clearBackground();

        animatePositionItems(
          previewItem,
          itemOffset[0],
          itemOffset[1],
          0,
          animator,
          index === previewItemContainer.children.length - 1
        );
      });
    });
  };

  const positionItems = (animator, { all = false }) => {
    const { piles, pileItemOffset, pileItemRotation } = store.state;
    const pileState = piles[id];

    if (whenCover && previewItemContainer.children.length) {
      positionPreviews(animator);
    } else if (normalItemContainer.children.length > 1) {
      if (!all) {
        if (newItems.size) {
          isPositioning = true;

          // newItems is a set, there is no index, so we're using a counter
          let count = 0;

          newItems.forEach(pileItem => {
            count++;

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

            const itemState = store.state.items[item.id];
            const itemIndex = allItems.indexOf(pileItem);

            const itemOffset = isFunction(pileItemOffset)
              ? pileItemOffset(itemState, itemIndex, pileState)
              : pileItemOffset.map(_offset => _offset * itemIndex);

            const itemRotation = isFunction(pileItemRotation)
              ? pileItemRotation(itemState, itemIndex, pileState)
              : pileItemRotation;

            animatePositionItems(
              displayObject,
              itemOffset[0],
              itemOffset[1],
              itemRotation,
              animator,
              count === newItems.size
            );
          });
        } else if (isPlaceholderDrawn) removePlaceholder();
      } else {
        isPositioning = true;

        normalItemContainer.children.forEach((normalItem, index) => {
          // eslint-disable-next-line no-underscore-dangle
          const item = normalItem.__pilingjs__item;
          const pileItem = normalItemIndex.get(item.id);

          const itemState = store.state.items[item.id];
          const itemIndex = allItems.indexOf(pileItem);

          const itemOffset = isFunction(pileItemOffset)
            ? pileItemOffset(itemState, itemIndex, pileState)
            : pileItemOffset.map(_offset => _offset * itemIndex);

          const itemRotation = isFunction(pileItemRotation)
            ? pileItemRotation(itemState, itemIndex, pileState)
            : pileItemRotation;

          animatePositionItems(
            normalItem,
            itemOffset[0],
            itemOffset[1],
            itemRotation,
            animator,
            index === normalItemContainer.children.length - 1
          );
        });
      }
      // Cover without previews
    } else if (isPlaceholderDrawn) removePlaceholder();
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
    { isMagnification = false, onDone = toVoid } = {}
  ) => {
    const done = () => {
      drawBorder();
      drawLabel();
      pubSub.publish('updatePileBounds', id);
      onDone();
    };

    const immideate = () => {
      setScale(newScale, { isMagnification });
      done();
    };

    if (isClose(getScale(), newScale, 3)) {
      immideate();
      return;
    }

    if (!isMagnification) {
      baseScale = newScale;
    }

    // Current size
    const size = Math.max(bBox.width, bBox.height);
    // Size difference in pixel
    const d = Math.abs((newScale / getScale()) * size - size);

    if (d < 2) {
      immideate();
      return;
    }

    isScaling = true;
    let duration = cubicOut(Math.min(d, 50) / 50) * 250;
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
        drawBorder();
      },
      onDone: () => {
        isScaling = false;
        postPilePositionAnimation.forEach(fn => fn());
        postPilePositionAnimation.clear();
        done();
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
  const getMoveToTweener = (
    x,
    y,
    { easing, isBatch = false, onDone = toVoid } = {}
  ) => {
    const d = l2PointDist(x, y, rootGraphics.x, rootGraphics.y);

    if (d < 3) {
      moveTo(x, y);
      pubSub.publish('updatePileBounds', id);
      onDone();
      return null;
    }

    isMoving = true;
    let duration = cubicOut(Math.min(d, 250) / 250) * 250;
    if (moveToTweener) {
      pubSub.publish('cancelAnimation', moveToTweener);
      if (moveToTweener.dt < moveToTweener.duration) {
        duration = moveToTweener.dt;
      }
    }
    moveToTweener = createTweener({
      duration,
      delay: 0,
      easing,
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
    if (!isBatch) pubSub.publish('startAnimation', moveToTweener);
    return moveToTweener;
  };

  const animateMoveTo = (
    x,
    y,
    { easing, onDone: customOnDone = toVoid } = {}
  ) =>
    new Promise(resolve => {
      const onDone = () => {
        resolve(store.state.piles[id]);
        customOnDone();
      };

      moveToTweener = getMoveToTweener(x, y, { easing, onDone });

      pubSub.publish('startAnimation', moveToTweener);
    });

  const updateBaseOffset = () => {
    const firstImage = allItems[0].item.image;
    if (firstImage.scaleFactor !== baseOffsetRelatedScaleFactor) {
      baseOffsetRelatedScaleFactor = firstImage.scaleFactor;
      baseOffset = firstImage.center;
    }
  };

  const moveTo = (x, y) => {
    rootGraphics.x = x;
    rootGraphics.y = y;
  };

  const replaceItemsImage = (itemId = null) => {
    if (itemId !== null) {
      // Just replace one item's image
      const pileItem = getItemById(itemId);
      if (hasNormalItem(pileItem)) {
        const newImage = pileItem.item.image;
        pileItem.replaceImage(newImage);
      } else if (hasPreviewItem(pileItem)) {
        const newImage = pileItem.item.preview;
        pileItem.replaceImage(newImage);
      }
    } else {
      normalItemIndex.forEach(pileItem => {
        const newImage = pileItem.item.image;
        pileItem.replaceImage(newImage);
      });
      previewItemIndex.forEach(pileItem => {
        const newImage = pileItem.item.preview;
        pileItem.replaceImage(newImage);
      });
    }
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
    previewItemIdIndex.delete(previewItemIndex.get(item.id).displayObject);
    normalItemIdIndex.set(normalItem.displayObject, item.id);

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
    normalItemIdIndex.delete(normalItemIndex.get(item.id).displayObject);
    previewItemIdIndex.set(previewItem.displayObject, item.id);

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
    const numItems = allItems.push(normalItem);
    if (numItems > 1) newItems.add(normalItem);
    normalItemIndex.set(normalItem.id, normalItem);
    normalItemIdIndex.set(normalItem.displayObject, normalItem.id);
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
    previewItemIdIndex.set(previewItem.displayObject, previewItem.id);
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

    if (allItems.length === 1) updateBaseOffset();
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
      normalItemIdIndex.delete(pileItem.displayObject);
    }
    if (hasItem(item, { asPreview: true })) {
      previewItemContainer.removeChildAt(
        previewItemContainer.getChildIndex(pileItem.displayObject)
      );
      previewItemIdIndex.delete(pileItem.displayObject);
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
    normalItemIdIndex.clear();
    previewItemIdIndex.clear();
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
  const setItems = (
    items,
    { asPreview = false } = {},
    shouldDrawPlaceholder = false
  ) => {
    if (shouldDrawPlaceholder) drawPlaceholder();

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

  const setCover = newWhenCover => {
    if (!newWhenCover) {
      removeCover();
    } else {
      whenCover = newWhenCover;
      whenCover.then(newCover => {
        cover = newCover;
        while (coverContainer.children.length) {
          coverContainer.removeChildAt(0);
        }
        coverContainer.addChild(cover.displayObject);
        pubSub.publish('updatePileBounds', id);
        drawBorder();
      });
    }
  };

  const removeCover = () => {
    if (!cover) return;

    while (coverContainer.children.length) {
      coverContainer.removeChildAt(0);
    }

    cover = undefined;
    whenCover = undefined;
  };

  let labelGraphics;
  let pileLabels = [];
  let labelColors = [];
  let labelTextures = [];
  let labelScaleFactors = [];

  const drawLabel = (
    labels = pileLabels,
    colors = labelColors,
    textures = labelTextures,
    scaleFactors = labelScaleFactors
  ) => {
    if (!labels.length) {
      if (labelGraphics) {
        pileLabels = [];
        labelColors = [];
        labelTextures = [];
        labelGraphics.clear();
        labelGraphics.removeChildren();
        render();
      }
      return;
    }

    pileLabels = labels;
    labelColors = colors;
    labelTextures = textures;
    labelScaleFactors = scaleFactors;

    if (isPositioning || isScaling) return;

    if (!labelGraphics) {
      labelGraphics = new PIXI.Graphics();
      rootGraphics.addChild(labelGraphics);
    } else {
      labelGraphics.clear();
      labelGraphics.removeChildren();
    }

    const {
      pileLabelHeight,
      pileLabelAlign,
      pileLabelFontSize,
      pileLabelStackAlign,
      pileLabelText,
      pileLabelTextOpacity,
      piles
    } = store.state;

    const labelAlign = getPileProp(pileLabelAlign, piles[id]);
    const labelFontSize = getPileProp(pileLabelFontSize, piles[id]);
    const labelStackAlign = getPileProp(pileLabelStackAlign, piles[id]);
    const labelHeight = getPileProp(pileLabelHeight, piles[id]);

    const bounds = getContentBounds();

    const showText = isFunction(pileLabelText)
      ? pileLabelText(piles[id])
      : pileLabelText;

    let labelWidth = bounds.width / labels.length;
    const labelHeightMax = labelTextures.length
      ? Math.max(showText * (labelFontSize + 1), labelHeight)
      : labelHeight;

    const y =
      labelAlign === 'top'
        ? bounds.y - labelHeightMax
        : bounds.y + bounds.height;

    const toTop = 1 + (y < 0) * -2;

    labels.forEach((label, index) => {
      let labelX;
      let labelY = y + toTop;
      let finalLabelHeight = labelHeightMax;
      switch (labelStackAlign) {
        case 'vertical':
          labelWidth = bounds.width * scaleFactors[index];
          labelX = -bounds.width / 2;
          labelY += (finalLabelHeight + 1) * index * toTop;
          break;

        case 'horizontal':
        default:
          labelX = labelWidth * index - bounds.width / 2;
          finalLabelHeight = labelHeightMax * scaleFactors[index];
          if (labelAlign === 'top') labelY += labelHeightMax - finalLabelHeight;
          break;
      }
      const color = colors[index];
      labelGraphics.beginFill(...color);
      labelGraphics.drawRect(labelX, labelY, labelWidth, finalLabelHeight);
      labelGraphics.endFill();
    });

    if (showText) {
      let textWidth = bounds.width / labelTextures.length;
      labelTextures.forEach((texture, index) => {
        let textX;
        let textY = y + toTop;
        switch (labelStackAlign) {
          case 'vertical':
            textWidth = bounds.width;
            textX = -bounds.width / 2 + textWidth / 2;
            textY += (labelHeightMax + 1) * index * toTop;
            break;

          case 'horizontal':
          default:
            textX = textWidth * index - bounds.width / 2 + textWidth / 2;
            break;
        }
        const labelText = new PIXI.Sprite(texture);
        labelText.anchor.set(0.5, 0);
        labelText.x = textX;
        labelText.y = textY;
        labelText.width /= 2 * window.devicePixelRatio;
        labelText.height /= 2 * window.devicePixelRatio;
        labelText.alpha = pileLabelTextOpacity;
        labelGraphics.addChild(labelText);
      });
    }

    render();
  };

  let placeholderGfx;
  let isPlaceholderDrawn = false;

  const drawPlaceholder = () => {
    if (!placeholderGfx) {
      placeholderGfx = new PIXI.Graphics();
      contentGraphics.addChild(placeholderGfx);
    }
    const width = anchorBox.width / baseScale;
    const height = anchorBox.height / baseScale;

    const r = width / 12;
    const color = store.state.darkMode ? 0xffffff : 0x000000;

    placeholderGfx
      .lineStyle(0)
      .beginFill(color, 1)
      .drawCircle(-width / 4, 0, r)
      .drawCircle(0, 0, r)
      .drawCircle(width / 4, 0, r)
      .endFill();

    // Draw background
    placeholderGfx
      .beginFill(color, 0.1)
      .drawRect(-width / 2, -height / 2, width, height)
      .endFill();

    isPlaceholderDrawn = true;

    render();
  };

  const removePlaceholder = () => {
    placeholderGfx.clear();
    isPlaceholderDrawn = false;
    render();
  };

  const init = () => {
    rootGraphics.addChild(borderedContentContainer);

    borderedContentContainer.addChild(borderGraphics);
    borderedContentContainer.addChild(contentGraphics);

    contentGraphics.addChild(normalItemContainer);
    contentGraphics.addChild(previewItemContainer);
    contentGraphics.addChild(coverContainer);
    contentGraphics.addChild(hoverItemContainer);
    contentGraphics.addChild(tempDepileContainer);
    contentGraphics.addChild(hoverPreviewContainer);

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
    get cover() {
      return cover;
    },
    get graphics() {
      return rootGraphics;
    },
    get contentGraphics() {
      return contentGraphics;
    },
    get height() {
      return borderedContentContainer.height;
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
    get offset() {
      return [
        (baseOffset[0] - anchorBox.localXOffset) * baseScale,
        (baseOffset[1] - anchorBox.localYOffset) * baseScale
      ];
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
    get width() {
      return borderedContentContainer.width;
    },
    get x() {
      return rootGraphics.x;
    },
    get y() {
      return rootGraphics.y;
    },
    id,
    // Methods
    animateMoveTo,
    animateOpacity,
    animateScale,
    blur,
    hover,
    focus,
    active,
    addItem,
    animatePositionItems,
    calcBBox,
    destroy,
    drawBorder,
    drawPlaceholder,
    drawSizeBadge,
    getMoveToTweener,
    getItemById,
    hasItem,
    magnifyByWheel,
    magnify,
    moveTo,
    positionItems,
    removeAllItems,
    removePlaceholder,
    setBorderSize,
    setItems,
    drawLabel,
    setCover,
    setScale,
    setOpacity,
    setVisibilityItems,
    setItemOrder,
    showSizeBadge,
    updateBounds,
    updateOffset: updateBaseOffset,
    replaceItemsImage,
    unmagnify
  };
};

export default createPile;
