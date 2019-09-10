import * as PIXI from 'pixi.js';

import createTweener from './tweener';
import { interpolateNumber } from './utils';

const MAX_SCALE = 5;

const createPile = (item, renderRaf, id, pubSub) => {
  const itemIds = new Map();
  const newItemIds = new Map();
  const pileGraphics = new PIXI.Graphics();
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

  const isFocus = [false];
  const isTempDepiled = [false];

  const pubSubSubscribers = [];
  let hoverItemSubscriber;
  let hoverItemEndSubscriber;

  const destroy = () => {
    pileGraphics.destroy();
    pubSubSubscribers.forEach(subscriber => {
      pubSub.unsubscribe(subscriber);
    });
  };

  // eslint-disable-next-line no-shadow
  const handleHoverItem = ({ item }) => {
    if (isFocus[0]) {
      if (!pileGraphics.isDragging) {
        const clonedSprite = item.cloneSprite();
        hoverItemContainer.addChild(clonedSprite);
        renderRaf();
      }
    }
  };

  const handleHoverItemEnd = () => {
    if (isFocus[0]) {
      if (hoverItemContainer.children.length === 2)
        hoverItemContainer.removeChildAt(0);
      renderRaf();
    }
  };

  const drawBorder = (thickness, color) => {
    const rect = itemContainer.getBounds();

    if (pileGraphics.scale.x !== 1) {
      rect.width /= pileGraphics.scale.x;
      rect.height /= pileGraphics.scale.x;
    }

    // eslint-disable-next-line no-use-before-define
    updateBBox();

    border.clear();
    border.lineStyle(thickness, color, 1);
    border.drawRect(
      // eslint-disable-next-line no-use-before-define
      bBox.minX - pileGraphics.x - thickness,
      // eslint-disable-next-line no-use-before-define
      bBox.minY - pileGraphics.y - thickness,
      rect.width + 2 * thickness,
      rect.height + 2 * thickness
    );

    renderRaf();
  };

  const onPointerDown = () => {
    pileGraphics.isPointerDown = true;
    // drawBorder(2, 0xfeeb77);
  };

  const onPointerUp = () => {
    pileGraphics.isPointerDown = false;
    if (pileGraphics.isHover) {
      // drawBorder(1, 0x91989F);
    }
  };

  const onPointerOver = () => {
    pileGraphics.isHover = true;
    if (isFocus[0]) {
      if (isTempDepiled[0]) {
        drawBorder(3, 0xe87a90);
      } else {
        drawBorder(2, 0xfeeb77);
      }
    } else {
      drawBorder(1, 0x91989f);
    }
    // add pubSub subscription for hoverItem
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
    if (pileGraphics.isDragging) return;
    pileGraphics.isHover = false;

    if (!isFocus[0]) border.clear();

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
    // trigger active pile
    pubSub.publish('dragPile', { pileId: id });

    // first get the offset from the Pointer position to the current pile.x and pile.y
    // And store it (draggingMouseOffset = [x, y])
    pileGraphics.draggingMouseOffset = [
      event.data.getLocalPosition(pileGraphics.parent).x - pileGraphics.x,
      event.data.getLocalPosition(pileGraphics.parent).y - pileGraphics.y
    ];
    pileGraphics.alpha = 1;
    pileGraphics.isDragging = true;
    pileGraphics.beforeDragX = pileGraphics.x;
    pileGraphics.beforeDragY = pileGraphics.y;
    // pileGraphics.dragTime = performance.now();
    renderRaf();
  };

  const onDragEnd = () => {
    if (!pileGraphics.isDragging) return;
    pileGraphics.alpha = 1;
    pileGraphics.isDragging = false;
    pileGraphics.draggingMouseOffset = null;
    // trigger collision check
    pubSub.publish('dropPile', { pileId: id });
    renderRaf();
  };

  const onDragMove = event => {
    if (pileGraphics.isDragging) {
      const newPosition = event.data.getLocalPosition(pileGraphics.parent);
      // remove offset
      pileGraphics.x = newPosition.x - pileGraphics.draggingMouseOffset[0];
      pileGraphics.y = newPosition.y - pileGraphics.draggingMouseOffset[1];
      pubSub.publish('highlightPile', { pileId: id });
      if (isTempDepiled[0]) {
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

    const scale = pileGraphics.scale.x;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    itemContainer.children.forEach(element => {
      const x = element.x + pileGraphics.x;
      const y = element.y + pileGraphics.y;
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

  const positionItems = (itemAlignment, itemRotated) => {
    if (itemAlignment) {
      switch (itemAlignment) {
        case 'top':
          itemContainer.children.forEach((child, childIndex) => {
            const padding = childIndex * 5 + 2;
            child.y = -padding;
          });
          break;

        case 'right':
          itemContainer.children.forEach((child, childIndex) => {
            const padding = childIndex * 5 + 2;
            child.x = padding;
          });
          break;

        // bottom-right
        default: {
          itemContainer.children.forEach((child, childIndex) => {
            const padding = childIndex * 5 + 2;
            child.x = padding;
            child.y = padding;
          });
        }
      }
    } else {
      // randomized offset
      const x = getRandomArbitrary(-10, 10);
      const y = getRandomArbitrary(-10, 10);
      let rotation;
      if (itemRotated) {
        rotation = getRandomArbitrary(-10, 10);
      }
      newItemIds.forEach((itm, idx) => {
        itm.x += x;
        itm.y += y;
        if (rotation) {
          itm.angle += rotation;
        }
        itemIds.set(idx, itm);
      });
      newItemIds.clear();
    }
  };

  const scale = wheelDelta => {
    const force = Math.log(Math.abs(wheelDelta) + 1);
    const momentum = Math.sign(wheelDelta) * force;

    const newScale = Math.min(
      Math.max(1, pileGraphics.scale.y * (1 + 0.075 * momentum)),
      MAX_SCALE
    );

    if (newScale > 1) {
      pileGraphics.scale.x = newScale;
      pileGraphics.scale.y = newScale;
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
        return pileGraphics.scale.x;
      },
      setter: newScale => {
        pileGraphics.scale.x = newScale;
        pileGraphics.scale.y = newScale;
      },
      onDone: () => {
        pubSub.publish('updateBBox', id);
      }
    });
    pubSub.publish('animate', scaleTweener);
    scaleUp = !scaleUp;
  };

  const init = () => {
    pileGraphics.addChild(borderContainer);
    pileGraphics.addChild(itemContainer);
    pileGraphics.addChild(hoverItemContainer);

    pileGraphics.interactive = true;
    pileGraphics.buttonMode = true;
    pileGraphics.x = 0;
    pileGraphics.y = 0;
    // Origin of the items coordinste system relative to the pile
    item.anchor.set(0);
    item.x = 2;
    item.y = 2;

    borderContainer.addChild(border);

    pileGraphics
      .on('pointerdown', onPointerDown)
      .on('pointerup', onPointerUp)
      .on('pointerupoutside', onPointerUp)
      .on('pointerover', onPointerOver)
      .on('pointerout', onPointerOut);

    pileGraphics
      .on('pointerdown', onDragStart)
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      .on('pointermove', onDragMove);

    itemContainer.addChild(item);

    itemIds.set(id, item);
  };

  init();

  return {
    destroy,
    drawBorder,
    border,
    itemIds,
    newItemIds,
    pileGraphics,
    itemContainer,
    id,
    bBox,
    calcBBox,
    updateBBox,
    positionItems,
    isFocus,
    isTempDepiled,
    scale,
    animateScale
  };
};

export default createPile;
