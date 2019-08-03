import * as PIXI from 'pixi.js';

const createPile = (item, renderRaf) => {
  const drawBorder = border => {
    const rect = item.getBounds();

    border.clear();
    border.lineStyle(2, 0xfeeb77, 1);
    border.beginFill(0xfff, 0);
    border.drawRect(
      -rect.width / 2,
      -rect.height / 2,
      rect.width + 4,
      rect.height + 4
    );
    border.endFill();
    renderRaf();
  };

  const onMouseDown = (pile, border) => () => {
    pile.isMouseDown = true;
    drawBorder(border);
  };

  const onMouseUp = (pile, border) => () => {
    pile.isMouseDown = false;
    if (pile.isHover) {
      drawBorder(border);
    } else {
      border.clear();
    }
  };

  const onMouseOver = (pile, border) => () => {
    pile.isHover = true;
    drawBorder(border);
  };

  const onMouseOut = (pile, border) => () => {
    if (pile.isDragging) return;
    pile.isHover = false;
    border.clear();
    renderRaf();
    //   console.log('HALLO');
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
    const stage = pile.parent;
    const index = stage.getChildIndex(pile);
    stage.removeChildAt(index);
    stage.addChildAt(pile, stage.children.length);
    pile.data = event.data;
    pile.alpha = 0.5;
    pile.isDragging = true;
    renderRaf();
  };

  const onDragEnd = pile => () => {
    pile.alpha = 1;
    pile.isDragging = false;
    // set the interaction data to null
    pile.data = null;
    renderRaf();
  };

  const onDragMove = pile => () => {
    if (pile.isDragging) {
      const newPosition = pile.data.getLocalPosition(pile.parent);
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

    pile.x = item.width / 2;
    pile.y = item.height / 2;

    pile.interactive = true;
    pile.buttonMode = true;
    item.anchor.set(0);
    item.x = -item.width / 2 + 2;
    item.y = -item.height / 2 + 2;

    initDrag(pile);
    initHover(pile, item);

    pile.addChild(item);

    return pile;
  };

  return {
    initPile
  };
};

export default createPile;
