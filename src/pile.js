import * as PIXI from 'pixi.js';

export const ANCHOR = [0, 0];

const createPile = (item, renderRaf, index, pubSub) => {
  const drawBorder = (pile, border) => {
    const rect = pile.getChildAt(1).getBounds();

    border.clear();
    border.lineStyle(2, 0xfeeb77, 1);
    border.drawRect(
      // eslint-disable-next-line no-use-before-define
      calcBBox().minX - pile.x - 2,
      // eslint-disable-next-line no-use-before-define
      calcBBox().minY - pile.y - 2,
      rect.width + 4,
      rect.height + 4
    );

    renderRaf();
  };

  const onMouseDown = (pile, border) => () => {
    pile.isMouseDown = true;
    drawBorder(pile, border);
  };

  const onMouseUp = (pile, border) => () => {
    pile.isMouseDown = false;
    if (pile.isHover) {
      drawBorder(pile, border);
    } else {
      border.clear();
    }
  };

  const onMouseOver = (pile, border) => () => {
    pile.isHover = true;
    drawBorder(pile, border);
  };

  const onMouseOut = (pile, border) => () => {
    if (pile.isDragging) return;
    pile.isHover = false;
    border.clear();
    renderRaf();
  };

  const initHover = (pile, borderContainer) => {
    const border = new PIXI.Graphics();
    borderContainer.addChild(border);

    pile
      .on('pointerdown', onMouseDown(pile, border))
      .on('pointerup', onMouseUp(pile, border))
      .on('pointerupoutside', onMouseUp(pile, border))
      .on('pointerover', onMouseOver(pile, border))
      .on('pointerout', onMouseOut(pile, border));
  };

  const onDragStart = pile => event => {
    // trigger active pile
    pubSub.publish('dragPile', index);

    // first get the offset from the mouse position to the current pile.x and pile.y
    // And store it (draggingMouseOffset = [x, y])
    pile.draggingMouseOffset = [
      event.data.getLocalPosition(pile.parent).x - pile.x,
      event.data.getLocalPosition(pile.parent).y - pile.y
    ];
    pile.alpha = 1;
    pile.isDragging = true;
    renderRaf();
  };

  const onDragEnd = pile => () => {
    if (!pile.isDragging) return;
    pile.alpha = 1;
    pile.isDragging = false;
    pile.draggingMouseOffset = null;
    // trigger collision check
    pubSub.publish('dropPile', index);
    renderRaf();
  };

  const onDragMove = pile => event => {
    if (pile.isDragging) {
      const newPosition = event.data.getLocalPosition(pile.parent);
      // remove offset
      pile.x = newPosition.x - pile.draggingMouseOffset[0];
      pile.y = newPosition.y - pile.draggingMouseOffset[1];
      pubSub.publish('highlightPile', index);

      renderRaf();
    }
  };

  const initDrag = pile => {
    pile
      .on('pointerdown', onDragStart(pile))
      .on('pointerup', onDragEnd(pile))
      .on('pointerupoutside', onDragEnd(pile))
      .on('pointermove', onDragMove(pile));
  };

  const itemIDs = new Map();

  const initPile = () => {
    const pile = new PIXI.Graphics();
    const itemContainer = new PIXI.Container();
    const borderContainer = new PIXI.Container();
    pile.addChild(borderContainer);
    pile.addChild(itemContainer);

    pile.interactive = true;
    pile.buttonMode = true;
    pile.x = 0; // use the ANCHOR
    pile.y = 0;
    // Origin of the items coordinste system relative to the pile
    item.anchor.set(0);
    item.x = 2;
    item.y = 2;

    initHover(pile, borderContainer);
    initDrag(pile);

    itemContainer.addChild(item);

    itemIDs.set(index, item);

    return pile;
  };

  const pileGraphics = initPile();
  const id = index;

  const bBox = {
    minX: null,
    minY: null,
    maxX: null,
    maxY: null,
    pileId: id
  };

  const setBBox = newBBox => {
    bBox.minX = newBBox.minX;
    bBox.minY = newBBox.minY;
    bBox.maxX = newBBox.maxX;
    bBox.maxY = newBBox.maxY;
  };

  const calcBBox = () => {
    // compute bounding box
    // const minX = pileGraphics.x;
    // const minY = pileGraphics.y;
    // const maxX = minX + pileGraphics.getChildAt(1).width;
    // const maxY = minY + pileGraphics.getChildAt(1).height;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = 0;
    let maxY = 0;

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

  return {
    drawBorder,
    initPile,
    itemIDs,
    pileGraphics,
    id,
    bBox,
    calcBBox,
    updateBBox
  };
};

export default createPile;
