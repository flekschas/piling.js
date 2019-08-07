import * as PIXI from 'pixi.js';

const createPile = (item, renderRaf, index, pubSub, activePile, normalPile) => {
  const drawBorder = (pile, border) => {
    const rect = item.getBounds();

    const length = pile.children.length - 2;

    border.clear();
    border.lineStyle(2, 0xfeeb77, 1);
    border.beginFill(0xfff, 0);
    border.drawRect(
      -rect.width / 2,
      -rect.height / 2,
      rect.width + 4 + length * 5,
      rect.height + 4 + length * 5
    );
    border.endFill();
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

  const initHover = pile => {
    const border = new PIXI.Graphics();
    pile.addChild(border);

    pile
      .on('pointerdown', onMouseDown(pile, border))
      .on('pointerup', onMouseUp(pile, border))
      .on('pointerupoutside', onMouseUp(pile, border))
      .on('pointerover', onMouseOver(pile, border))
      .on('pointerout', onMouseOut(pile, border));
  };

  const onDragStart = pile => event => {
    activePile.addChild(pile);

    pile.eventData = event.data;
    pile.alpha = 1;
    pile.isDragging = true;
    renderRaf();
  };

  const onDragEnd = pile => () => {
    activePile.removeChildren();
    normalPile.addChild(pile);

    pile.alpha = 1;
    pile.isDragging = false;
    // set the interaction data to null
    pile.eventData = null;
    // trigger collision check
    pubSub.publish('dropPile', index);
    renderRaf();
  };

  const onDragMove = pile => () => {
    if (pile.isDragging) {
      const newPosition = pile.eventData.getLocalPosition(pile.parent);
      pile.x = newPosition.x;
      pile.y = newPosition.y;
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

  const initPile = () => {
    const pile = new PIXI.Graphics();

    pile.interactive = true;
    pile.buttonMode = true;
    pile.x = item.width / 2;
    pile.y = item.height / 2;
    item.anchor.set(0);
    item.x = -item.width / 2 + 2;
    item.y = -item.height / 2 + 2;

    initHover(pile);
    initDrag(pile);

    pile.addChild(item);

    return pile;
  };

  const pileGraphics = initPile();
  const id = index;

  return {
    initPile,
    pileGraphics,
    id
  };
};

export default createPile;
