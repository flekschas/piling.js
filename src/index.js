import * as PIXI from 'pixi.js';
import createPubSub from 'pub-sub-es';
import withRaf from 'with-raf';
import * as RBush from 'rbush';
import withThrottle from 'lodash-es/throttle';
import { scaleLinear } from 'd3-scale';
import normalizeWheel from 'normalize-wheel';

import createStore, {
  initPiles,
  mergePiles,
  movePiles,
  setItemRenderer,
  setItems,
  setOrderer,
  setGrid,
  setItemSizeRange,
  setItemAlignment,
  setItemRotated,
  setPileClicked
} from './store';

import { dist, getBBox, isPileInPolygon } from './utils';

import createPile from './pile';
import createGrid from './grid';
import createItem from './item';

const createPileMe = rootElement => {
  const canvas = document.createElement('canvas');
  const pubSub = createPubSub();
  const store = createStore();

  let state = store.getState();

  const renderer = new PIXI.Renderer({
    width: rootElement.getBoundingClientRect().width,
    height: rootElement.getBoundingClientRect().height,
    view: canvas,
    antialias: true,
    transparent: true,
    resolution: window.devicePixelRatio,
    autoResize: true
  });

  const stage = new PIXI.Container();
  stage.interactive = true;
  stage.sortableChildren = true;

  const get = property => {
    switch (property) {
      case 'renderer':
        return state.itemRenderer;

      case 'items':
        return state.items;

      case 'piles':
        return state.piles;

      case 'orderer':
        return state.orderer;

      case 'grid':
        return state.grid;

      case 'itemSizeRange':
        return state.itemSizeRange;

      case 'itemAlignment':
        return state.itemAlignment;

      case 'itemRotated':
        return state.itemRotated;

      case 'pileClicked':
        return state.pileClicked;

      default:
        console.warn(`Unknown property "${property}"`);
        return undefined;
    }
  };

  const set = (property, value) => {
    const actions = [];

    switch (property) {
      case 'renderer':
        actions.push(setItemRenderer(value));
        break;

      case 'items':
        actions.push(setItems(value));
        actions.push(initPiles(value.length));
        break;

      case 'orderer':
        actions.push(setOrderer(value));
        break;

      case 'grid':
        actions.push(setGrid(value));
        break;

      case 'itemSizeRange':
        actions.push(setItemSizeRange(value));
        break;

      case 'itemAlignment':
        actions.push(setItemAlignment(value));
        break;

      case 'itemRotated':
        actions.push(setItemRotated(value));
        break;

      case 'pileClicked':
        actions.push(setPileClicked(value));
        break;

      default:
        console.warn(`Unknown property "${property}"`);
    }

    if (actions.length !== 0) {
      actions.forEach(action => {
        store.dispatch(action);
      });
    }
  };

  const render = () => {
    renderer.render(stage);
  };

  const renderRaf = withRaf(render);

  const renderedItems = new Map();
  const pileInstances = new Map();
  const activePile = new PIXI.Container();
  const normalPile = new PIXI.Container();

  const searchIndex = new RBush();

  const createRBush = () => {
    searchIndex.clear();

    const boxList = [];

    if (pileInstances) {
      pileInstances.forEach(pile => {
        pile.updateBBox();
        boxList.push(pile.bBox);
      });
      searchIndex.load(boxList);
    }
  };

  const deleteSearchIndex = pileId => {
    const pile = pileInstances.get(pileId);

    searchIndex.remove(pile.bBox, (a, b) => {
      return a.pileId === b.pileId;
    });
  };

  const updateBoundingBox = pileId => {
    const pile = pileInstances.get(pileId);

    searchIndex.remove(pile.bBox, (a, b) => {
      return a.pileId === b.pileId;
    });
    pile.updateBBox();
    searchIndex.insert(pile.bBox);
  };

  let layout;

  const initGrid = () => {
    const { grid } = store.getState();

    layout = createGrid(canvas, grid);
  };

  const scaleItems = () => {
    let min = Infinity;
    let max = 0;

    renderedItems.forEach(item => {
      const longerBorder = Math.max(item.sprite.width, item.sprite.height);
      if (longerBorder > max) max = longerBorder;
      if (longerBorder < min) min = longerBorder;
    });

    const { itemSizeRange } = store.getState();
    let range;

    const minRange = Math.min(layout.myColWidth, layout.myRowHeight);

    // if it's within [0, 1] assume it's relative
    if (
      itemSizeRange[0] > 0 &&
      itemSizeRange[0] <= 1 &&
      itemSizeRange[1] > 0 &&
      itemSizeRange[1] <= 1
    ) {
      range = [minRange * itemSizeRange[0], minRange * itemSizeRange[1]];
    }
    // else assume absolute values in pixels
    else {
      range = itemSizeRange;
    }

    const scale = scaleLinear()
      .domain([min, max])
      .range(range);

    scale.clamp(true);

    renderedItems.forEach(item => {
      const ratio = item.sprite.height / item.sprite.width;
      if (item.sprite.width > item.sprite.height) {
        item.sprite.width = scale(item.sprite.width);
        item.sprite.height = item.sprite.width * ratio;
      } else {
        item.sprite.height = scale(item.sprite.height);
        item.sprite.width = item.sprite.height / ratio;
      }
    });
  };

  const lassoContainer = new PIXI.Container();
  const lassoBgContainer = new PIXI.Container();
  const lasso = new PIXI.Graphics();
  const lassoFill = new PIXI.Graphics();

  const createItems = () => {
    const { itemRenderer, items } = store.getState();

    renderedItems.clear();
    pileInstances.clear();

    stage.removeChildren();

    stage.addChild(lassoBgContainer);
    lassoBgContainer.addChild(lassoFill);
    stage.addChild(normalPile);

    return Promise.all(items.map(({ src }) => itemRenderer(src))).then(
      newRenderedItems => {
        newRenderedItems.forEach((item, index) => {
          const newItem = createItem(index, item, pubSub);
          renderedItems.set(index, newItem);
          const pile = createPile(newItem.sprite, renderRaf, index, pubSub);
          pileInstances.set(index, pile);
          normalPile.addChild(pile.pileGraphics);
        });
        scaleItems();
        stage.addChild(activePile);
        stage.addChild(lassoContainer);
        lassoContainer.addChild(lasso);
        renderRaf();
      }
    );
  };

  const positionPiles = () => {
    const { items, orderer, grid } = store.getState();

    if (items.length === 0 || !orderer || grid.length === 0) return;

    const movingPiles = [];

    if (pileInstances) {
      pileInstances.forEach((pile, id) => {
        let x;
        let y;
        if (items[id].position) {
          [x, y] = items[id].position;
        } else {
          const getPosition = orderer(layout.myColNum);
          [x, y] = getPosition(id);
        }

        x *= layout.myColWidth;
        y *= layout.myRowHeight;

        pile.pileGraphics.x += x;
        pile.pileGraphics.y += y;

        movingPiles.push({
          id,
          x: pile.pileGraphics.x,
          y: pile.pileGraphics.y
        });
      });
      createRBush();
      renderRaf();
    }
  };

  const positionItems = pileId => {
    const { itemAlignment, itemRotated } = store.getState();

    pileInstances.get(pileId).positionItems(itemAlignment, itemRotated);
  };

  const updatePileItems = (pile, id) => {
    const pileInstance = pileInstances.get(id);
    if (pile.items.length === 0) {
      deleteSearchIndex(id);
      pileInstance.destroy();
      pileInstances.delete(id);
    } else {
      pileInstance.pileGraphics.getChildAt(2).removeChildren();
      pile.items.forEach(itemId => {
        pileInstance.pileGraphics
          .getChildAt(2)
          .addChild(renderedItems.get(itemId).sprite);
        if (!pileInstance.itemIds.has(itemId)) {
          pileInstance.newItemIds.set(itemId, renderedItems.get(itemId).sprite);
        }
      });
      positionItems(id);
    }
  };

  let mousePosition = [0, 0];

  // Get a copy of the current mouse position
  const getMousePos = () => mousePosition.slice();

  const getRelativeMousePosition = event => {
    const rect = canvas.getBoundingClientRect();

    mousePosition[0] = event.clientX - rect.left;
    mousePosition[1] = event.clientY - rect.top;

    return [...mousePosition];
  };

  const LASSO_MIN_DIST = 8;
  const LASSO_MIN_DELAY = 25;
  let lassoPos = [];
  let lassoPosFlat = [];
  let lassoPrevMousePos;
  let isLasso = false;

  const drawlasso = () => {
    lasso.clear();
    lassoFill.clear();
    lasso.lineStyle(2, 0xffffff, 1);
    lasso.moveTo(...lassoPos[0]);
    lassoPos.forEach(pos => {
      lasso.lineTo(...pos);
      lasso.moveTo(...pos);
    });
    lassoFill.beginFill(0xffffff, 0.2);
    lassoFill.drawPolygon(lassoPosFlat);
    renderRaf();
  };

  let mouseDown = false;

  const lassoExtend = () => {
    if (!mouseDown) return;

    const currMousePos = getMousePos();

    if (!lassoPrevMousePos) {
      lassoPos.push(currMousePos);
      lassoPosFlat.push(...currMousePos);
      lassoPrevMousePos = currMousePos;
      lasso.moveTo(...currMousePos);
    } else {
      const d = dist(...currMousePos, ...lassoPrevMousePos);

      if (d > LASSO_MIN_DIST) {
        lassoPos.push(currMousePos);
        lassoPosFlat.push(...currMousePos);
        lassoPrevMousePos = currMousePos;
        if (lassoPos.length > 1) {
          drawlasso();
          isLasso = true;
        }
      }
    }
  };
  const lassoExtendDb = withThrottle(lassoExtend, LASSO_MIN_DELAY, true);

  const findPilesInLasso = lassoPolygon => {
    // get the bounding box of the lasso selection...
    const bBox = getBBox(lassoPolygon);
    // ...to efficiently preselect potentially selected Piles
    const pilesInBBox = searchIndex.search(bBox);
    // next we test each Pile in the bounding box if it is in the polygon too
    const pilesInPolygon = [];
    pilesInBBox.forEach(pile => {
      if (
        isPileInPolygon([pile.minX, pile.minY], lassoPolygon) ||
        isPileInPolygon([pile.minX, pile.maxY], lassoPolygon) ||
        isPileInPolygon([pile.maxX, pile.minY], lassoPolygon) ||
        isPileInPolygon([pile.maxX, pile.maxY], lassoPolygon)
      )
        pilesInPolygon.push(pile.pileId);
    });

    return pilesInPolygon;
  };

  const lassoEnd = () => {
    if (isLasso) {
      const pilesInLasso = findPilesInLasso(lassoPosFlat);
      console.log(pilesInLasso);
      if (pilesInLasso.length > 1) {
        // mergeMultiPiles(pilesInLasso);
        store.dispatch(mergePiles(pilesInLasso, false));
      }
      lasso.closePath();
      lasso.clear();
      lassoFill.clear();
      render();
      isLasso = false;
    }
    lassoPos = [];
    lassoPosFlat = [];
    lassoPrevMousePos = undefined;
  };

  const scalePile = (pileId, wheelDelta) => {
    const pile = pileInstances.get(pileId).pileGraphics;

    const force = Math.log(Math.abs(wheelDelta));
    const momentum = wheelDelta > 0 ? force : -force;

    const newScale = Math.min(
      Math.max(1, pile.scale.y * (1 + 0.1 * momentum)),
      5
    );

    if (newScale > 1) {
      pile.scale.x = newScale;
      pile.scale.y = newScale;
      updateBoundingBox(pileId);
    }
    renderRaf();
  };

  let stateUpdates;

  const updated = () => {
    const newState = store.getState();

    stateUpdates = new Set();
    const updates = [];

    if (
      state.items !== newState.items ||
      state.itemRenderer !== newState.itemRenderer
    ) {
      updates.push(createItems());
      stateUpdates.add('piles');
    }

    if (state.itemSizeRange !== newState.itemSizeRange) {
      stateUpdates.add('layout');
    }

    if (state.piles !== newState.piles) {
      if (state.piles.length !== 0) {
        newState.piles.forEach((pile, id) => {
          if (pile.items.length !== state.piles[id].items.length) {
            updatePileItems(pile, id);
          }
          if (
            (pile.x !== state.piles[id].x || pile.y !== state.piles[id].y) &&
            pile.items.length !== 0
          ) {
            updateBoundingBox(id);
          }
        });
      }
    }

    if (state.orderer !== newState.orderer) {
      stateUpdates.add('layout');
    }

    if (state.grid !== newState.grid) {
      initGrid();
      stateUpdates.add('layout');
    }

    if (state.itemAlignment !== newState.itemAlignment) {
      stateUpdates.add('layout');
    }

    if (state.itemRotated !== newState.itemRotated) {
      stateUpdates.add('layout');
    }

    if (state.pileClicked !== newState.pileClicked) {
      if (newState.pileClicked.length !== 0) {
        const newPile = pileInstances.get(newState.pileClicked[0]);
        newPile.drawBorder(newPile.border);
        newPile.isFocus[0] = true;
        if (state.pileClicked.length !== 0) {
          const oldPile = pileInstances.get(state.pileClicked[0]);
          oldPile.border.clear();
          oldPile.isFocus[0] = false;
        }
      } else {
        const pile = pileInstances.get(state.pileClicked[0]);
        pile.border.clear();
        pile.isFocus[0] = false;
      }
      renderRaf();
    }

    if (updates.length !== 0) {
      Promise.all(updates).then(() => {
        if (stateUpdates.has('piles') || stateUpdates.has('layout')) {
          positionPiles();
        }
      });
    }

    state = newState;
  };

  const handleDropPile = ({ pileId }) => {
    let hit;
    const pile = pileInstances.get(pileId).pileGraphics;

    const collidePiles = searchIndex
      .search(pileInstances.get(pileId).calcBBox())
      .filter(collidePile => collidePile.pileId !== pileId);

    // only one pile is colliding with the pile
    if (collidePiles.length === 1) {
      // mergePile(pileId, collidePiles[0].pileId);
      store.dispatch(mergePiles([pileId, collidePiles[0].pileId], true));
      hit = true;
    } else {
      store.dispatch(
        movePiles([
          {
            id: pileId,
            x: pile.x,
            y: pile.y
          }
        ])
      );
    }

    activePile.removeChildren();
    // if hit = true, then the original pile is destoryed
    if (hit !== true) {
      normalPile.addChild(pile);
    }
  };

  const handleDragPile = ({ pileId }) => {
    const pile = pileInstances.get(pileId).pileGraphics;
    activePile.addChild(pile);
  };

  let oldResult = [];
  let newResult = [];

  const handleHighlightPile = ({ pileId }) => {
    oldResult = [...newResult];
    newResult = searchIndex.search(pileInstances.get(pileId).calcBBox());

    if (oldResult !== []) {
      oldResult.forEach(collidePile => {
        if (pileInstances.get(collidePile.pileId)) {
          const pile = pileInstances.get(collidePile.pileId);
          pile.border.clear();
        }
      });
    }

    newResult.forEach(collidePile => {
      if (pileInstances.get(collidePile.pileId)) {
        const pile = pileInstances.get(collidePile.pileId);
        pile.drawBorder(pile.border);
      }
    });
  };

  // let mouseDownShift = false;
  let mouseDownPosition = [0, 0];

  const mouseDownHandler = event => {
    render();

    mouseDownPosition = getRelativeMousePosition(event);

    // whether mouse click on any pile
    const result = searchIndex.collides({
      minX: mouseDownPosition[0],
      minY: mouseDownPosition[1],
      maxX: mouseDownPosition[0] + 1,
      maxY: mouseDownPosition[1] + 1
    });

    if (!result) {
      mouseDown = true;
    }
  };

  const mouseUpHandler = () => {
    if (mouseDown) {
      lassoEnd();
      mouseDown = false;
    }
  };

  const mouseClickHandler = event => {
    getRelativeMousePosition(event);

    const result = searchIndex.search({
      minX: mouseDownPosition[0],
      minY: mouseDownPosition[1],
      maxX: mouseDownPosition[0] + 1,
      maxY: mouseDownPosition[1] + 1
    });

    if (result.length !== 0) {
      store.dispatch(setPileClicked([result[0].pileId]));
    } else {
      store.dispatch(setPileClicked([]));
    }
  };

  const mouseMoveHandler = event => {
    mousePosition = getRelativeMousePosition(event);

    lassoExtendDb();
  };

  const mouseDblClickHandler = event => {
    getRelativeMousePosition(event);

    const result = searchIndex.collides({
      minX: mouseDownPosition[0],
      minY: mouseDownPosition[1],
      maxX: mouseDownPosition[0] + 1,
      maxY: mouseDownPosition[1] + 1
    });

    if (result) {
      // console.log(result)
    }
  };

  const mouseWheelHandler = event => {
    event.preventDefault();

    // getRelativeMousePosition(event);

    const result = searchIndex.search({
      minX: mousePosition[0],
      minY: mousePosition[1],
      maxX: mousePosition[0] + 1,
      maxY: mousePosition[1] + 1
    });

    if (result.length !== 0) {
      const normalizedDeltaY = normalizeWheel(event).pixelY;
      scalePile(result[0].pileId, normalizedDeltaY);
    }
  };

  const init = () => {
    // Setup event handler
    window.addEventListener('blur', () => {}, false);
    window.addEventListener('mousedown', mouseDownHandler, false);
    window.addEventListener('mouseup', mouseUpHandler, false);
    window.addEventListener('mousemove', mouseMoveHandler, false);
    canvas.addEventListener('mouseenter', () => {}, false);
    canvas.addEventListener('mouseleave', () => {}, false);
    canvas.addEventListener('click', mouseClickHandler, false);
    canvas.addEventListener('dblclick', mouseDblClickHandler, false);
    canvas.addEventListener('wheel', mouseWheelHandler, false);

    pubSub.subscribe('dropPile', handleDropPile);
    pubSub.subscribe('dragPile', handleDragPile);
    pubSub.subscribe('highlightPile', handleHighlightPile);

    store.subscribe(updated);
    rootElement.appendChild(canvas);
  };

  const destroy = () => {
    // Remove event listeners
    window.removeEventListener('keyup', () => {}, false);
    window.removeEventListener('blur', () => {}, false);
    window.removeEventListener('mousedown', mouseDownHandler, false);
    window.removeEventListener('mouseup', mouseUpHandler, false);
    window.removeEventListener('mousemove', mouseMoveHandler, false);
    canvas.removeEventListener('mouseenter', () => {}, false);
    canvas.removeEventListener('mouseleave', () => {}, false);
    canvas.removeEventListener('click', mouseClickHandler, false);
    canvas.removeEventListener('dblclick', mouseDblClickHandler, false);
    canvas.removeEventListener('wheel', mouseWheelHandler, false);

    stage.destroy(false);
    renderer.destroy(true);
    store.unsubscribe(updated);

    rootElement.removeChild(canvas);
    pubSub.clear();
  };

  init();

  return {
    destroy,
    get,
    render: renderRaf,
    set,
    subscribe: pubSub.subscribe,
    unsubscribe: pubSub.unsubscribe
  };
};

export default createPileMe;
