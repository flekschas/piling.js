import * as PIXI from 'pixi.js';

// export const ANCHOR = [0, 0];

const createPile = (item, renderRaf, id, pubSub) => {
  const itemIds = new Map();
  const newItemIds = new Map();
  const pileGraphics = new PIXI.Graphics();
  const itemContainer = new PIXI.Container();
  const borderContainer = new PIXI.Container();
  const hoverItemContainer = new PIXI.Container();
  const bBox = {
    minX: null,
    minY: null,
    maxX: null,
    maxY: null,
    pileId: id
  };

  const handleHoverItem = hoveredItem => {
    console.log(hoveredItem.id);
  };

  const drawBorder = border => {
    const rect = pileGraphics.getChildAt(1).getBounds();

    border.clear();
    border.lineStyle(2, 0xfeeb77, 1);
    border.drawRect(
      // eslint-disable-next-line no-use-before-define
      calcBBox().minX - pileGraphics.x - 2,
      // eslint-disable-next-line no-use-before-define
      calcBBox().minY - pileGraphics.y - 2,
      rect.width + 4,
      rect.height + 4
    );

    renderRaf();
  };

  const onMouseDown = border => () => {
    pileGraphics.isMouseDown = true;
    drawBorder(border);
  };

  const onMouseUp = border => () => {
    pileGraphics.isMouseDown = false;
    if (pileGraphics.isHover) {
      drawBorder(border);
    } else {
      border.clear();
    }
  };

  let isSubscribe = false;

  const onMouseOver = border => () => {
    pileGraphics.isHover = true;
    drawBorder(border);
    // add pubSub subscription for hoverItem
    if (!isSubscribe) {
      pubSub.subscribe('hoverItem', handleHoverItem);
      isSubscribe = true;
    }
  };

  const onMouseOut = border => () => {
    if (pileGraphics.isDragging) return;
    pileGraphics.isHover = false;
    border.clear();
    renderRaf();
    // remove pubSub subscription for hoverItem
    pubSub.unsubscribe('hoverItem');
  };

  const initHover = () => {
    const border = new PIXI.Graphics();
    borderContainer.addChild(border);

    pileGraphics
      .on('pointerdown', onMouseDown(border))
      .on('pointerup', onMouseUp(border))
      .on('pointerupoutside', onMouseUp(border))
      .on('pointerover', onMouseOver(border))
      .on('pointerout', onMouseOut(border));
  };

  const onDragStart = event => {
    // trigger active pile
    pubSub.publish('dragPile', id);

    // first get the offset from the mouse position to the current pile.x and pile.y
    // And store it (draggingMouseOffset = [x, y])
    pileGraphics.draggingMouseOffset = [
      event.data.getLocalPosition(pileGraphics.parent).x - pileGraphics.x,
      event.data.getLocalPosition(pileGraphics.parent).y - pileGraphics.y
    ];
    pileGraphics.alpha = 1;
    pileGraphics.isDragging = true;
    renderRaf();
  };

  const onDragEnd = () => {
    if (!pileGraphics.isDragging) return;
    pileGraphics.alpha = 1;
    pileGraphics.isDragging = false;
    pileGraphics.draggingMouseOffset = null;
    // trigger collision check
    pubSub.publish('dropPile', id);
    renderRaf();
  };

  const onDragMove = event => {
    if (pileGraphics.isDragging) {
      const newPosition = event.data.getLocalPosition(pileGraphics.parent);
      // remove offset
      pileGraphics.x = newPosition.x - pileGraphics.draggingMouseOffset[0];
      pileGraphics.y = newPosition.y - pileGraphics.draggingMouseOffset[1];
      pubSub.publish('highlightPile', id);

      renderRaf();
    }
  };

  const initDrag = () => {
    pileGraphics
      .on('pointerdown', onDragStart)
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      .on('pointermove', onDragMove);
  };

  const setBBox = newBBox => {
    bBox.minX = newBBox.minX;
    bBox.minY = newBBox.minY;
    bBox.maxX = newBBox.maxX;
    bBox.maxY = newBBox.maxY;
  };

  const calcBBox = () => {
    // compute bounding box

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    pileGraphics.getChildAt(1).children.forEach(element => {
      const x = element.x + pileGraphics.x;
      const y = element.y + pileGraphics.y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + element.width > maxX) maxX = x + element.width;
      if (y + element.height > maxY) maxY = y + element.height;
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
          pileGraphics.getChildAt(1).children.forEach((child, childIndex) => {
            const padding = childIndex * 5 + 2;
            child.y = -padding;
          });
          break;

        case 'right':
          pileGraphics.getChildAt(1).children.forEach((child, childIndex) => {
            const padding = childIndex * 5 + 2;
            child.x = padding;
          });
          break;

        // bottom-right
        default: {
          pileGraphics.getChildAt(1).children.forEach((child, childIndex) => {
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

    // initHoverItem();

    initHover();
    initDrag();

    itemContainer.addChild(item);

    itemIds.set(id, item);
  };

  init();

  return {
    drawBorder,
    itemIds,
    newItemIds,
    pileGraphics,
    id,
    bBox,
    calcBBox,
    updateBBox,
    positionItems
  };
};

export default createPile;
