import * as PIXI from 'pixi.js';

const createPile = (item, renderRaf, id, pubSub) => {
  const itemIds = new Map();
  const newItemIds = new Map();
  const pileGraphics = new PIXI.Graphics();
  const itemContainer = new PIXI.Container();
  const borderContainer = new PIXI.Container();
  const hoverItemContainer = new PIXI.Container();
  const border = new PIXI.Graphics();
  const pileInteractiveBorder = new PIXI.Sprite();

  const bBox = {
    minX: null,
    minY: null,
    maxX: null,
    maxY: null,
    pileId: id
  };

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
    if (!pileGraphics.isDragging) {
      const clonedItem = item.clone();
      hoverItemContainer.addChild(clonedItem);
      renderRaf();
    }
  };

  const handleHoverItemEnd = () => {
    if (hoverItemContainer.children.length === 2)
      hoverItemContainer.removeChildAt(0);
    renderRaf();
  };

  const drawBorder = () => {
    const rect = itemContainer.getBounds();

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

  const onPointerDown = () => {
    pileGraphics.isPointerDown = true;
    drawBorder();
  };

  const onPointerUp = () => {
    pileGraphics.isPointerDown = false;
    if (pileGraphics.isHover) {
      drawBorder();
    } else {
      border.clear();
    }
  };

  const onPointerOver = () => {
    pileGraphics.isHover = true;
    drawBorder();
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
    border.clear();
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
    pubSub.publish('dragPile', id);

    // first get the offset from the Pointer position to the current pile.x and pile.y
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
      drawBorder();
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

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    itemContainer.children.forEach(element => {
      const x = element.x + pileGraphics.x;
      const y = element.y + pileGraphics.y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + element.width > maxX) maxX = x + element.width;
      if (y + element.height > maxY) maxY = y + element.height;
    });

    pileInteractiveBorder.x = 0;
    pileInteractiveBorder.y = 0;
    pileInteractiveBorder.width = maxX - minX + 4;
    pileInteractiveBorder.height = maxY - minY + 4;
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

  const init = () => {
    pileInteractiveBorder.interactive = true;
    pileGraphics.addChild(pileInteractiveBorder);

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
