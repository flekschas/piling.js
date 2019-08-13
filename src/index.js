import * as PIXI from 'pixi.js';
import createPubSub from 'pub-sub-es';
import withRaf from 'with-raf';
import * as RBush from 'rbush';
import withThrottle from 'lodash-es/throttle';

import createStore, {
  setItemRenderer,
  setItems,
  setOrderer,
  setGrid
} from './store';

import { dist, getBBox, isPileInPolygon } from './utils';

import createPile from './pile';
import creatGrid from './grid';
// import hitTestRectangle from './pileManager';

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

      case 'orderer':
        return state.orderer;

      case 'grid':
        return state.grid;

      default:
        console.warn(`Unknown property "${property}"`);
        return undefined;
    }
  };

  const set = (property, value) => {
    let action;

    switch (property) {
      case 'renderer':
        action = setItemRenderer(value);
        break;

      case 'items':
        action = setItems(value);
        break;

      case 'orderer':
        action = setOrderer(value);
        break;

      case 'grid':
        action = setGrid(value);
        break;

      default:
        console.warn(`Unknown property "${property}"`);
    }

    if (action) store.dispatch(action);
  };

  const render = () => {
    renderer.render(stage);
  };

  const renderRaf = withRaf(render);

  const piles = new Map();
  const activePile = new PIXI.Container();
  const normalPile = new PIXI.Container();

  const searchIndex = new RBush();

  const createRBush = () => {
    searchIndex.clear();

    const boxList = [];

    if (piles) {
      piles.forEach((pile, id) => {
        const offsetX = pile.itemIDs.get(id).width / 2;
        const offsetY = pile.itemIDs.get(id).height / 2;
        const minx = pile.pileGraphics.x - offsetX;
        const miny = pile.pileGraphics.y - offsetY;
        const maxx = minx + pile.pileGraphics.getChildAt(1).width;
        const maxy = miny + pile.pileGraphics.getChildAt(1).height;
        const box = {
          minX: minx,
          minY: miny,
          maxX: maxx,
          maxY: maxy,
          pileId: id
        };
        pile.pileBox = box;
        boxList.push(box);
      });
      searchIndex.load(boxList);
    }
  };

  // const updateSearchIndex = pileId => {
  //   const pile = piles.get(pileId);
  //   const pileBox = pile.pileBox;
  //   console.log(searchIndex);
  //   searchIndex.remove(pileBox);
  //   pileBox.minX = pile.pileGraphics.worldTransform.tx;
  //   pileBox.miny = pile.pileGraphics.worldTransform.ty;
  //   pileBox.maxX = pileBox.minX + pile.pileGraphics.getChildAt(1).width;
  //   pileBox.maxY = pileBox.minY + pile.pileGraphics.getChildAt(1).height;
  //   pileBox.id = pileId;
  //   searchIndex.insert(pileBox);
  // }

  const lassoContainer = new PIXI.Container();
  const lassoBgContainer = new PIXI.Container();
  const lasso = new PIXI.Graphics();
  const lassoFill = new PIXI.Graphics();

  const createItems = () => {
    const { itemRenderer, items } = store.getState();

    piles.clear();

    stage.removeChildren();

    stage.addChild(lassoBgContainer);
    lassoBgContainer.addChild(lassoFill);
    stage.addChild(normalPile);

    const renderItems = items.map(({ src }) => itemRenderer(src));

    return Promise.all(renderItems).then(itemsA => {
      itemsA.forEach((item, index) => {
        const pile = createPile(item, renderRaf, index, pubSub);
        piles.set(index, pile);
        normalPile.addChild(pile.pileGraphics);
      });
      stage.addChild(activePile);
      stage.addChild(lassoContainer);
      lassoContainer.addChild(lasso);
      renderRaf();
    });
  };

  let layout;

  const initGrid = () => {
    const { grid } = store.getState();

    layout = creatGrid(canvas, grid);
  };

  const positionPiles = () => {
    const { items, orderer } = store.getState();

    if (piles) {
      piles.forEach((pile, id) => {
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
      });
      createRBush();
      renderRaf();
    }
  };

  const mousePosition = [0, 0];

  // Get a copy of the current mouse position
  const getMousePos = () => mousePosition.slice();

  const getRelativeMousePosition = event => {
    const rect = canvas.getBoundingClientRect();

    mousePosition[0] = event.clientX - rect.left;
    mousePosition[1] = event.clientY - rect.top;

    return [...mousePosition];
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

    if (state.orderer !== newState.orderer) stateUpdates.add('layout');

    if (state.grid !== newState.grid) {
      initGrid();
      stateUpdates.add('layout');
    }

    Promise.all(updates).then(() => {
      if (stateUpdates.has('piles') || stateUpdates.has('layout')) {
        positionPiles();
      }
    });

    state = newState;
  };

  const mergePile = (sourceId, targetId) => {
    // get item container
    const source = piles.get(sourceId).pileGraphics.getChildAt(1);
    const target = piles.get(targetId).pileGraphics.getChildAt(1);

    piles.get(sourceId).itemIDs.forEach((item, id) => {
      piles.get(targetId).itemIDs.set(id, item);
    });

    const srcLength = source.children.length;
    for (let i = 0; i < srcLength; i++) {
      // move one container's child to another container means
      // that child is removed from the original container
      // so always add the first child
      target.addChild(source.children[0]);
    }

    target.children.forEach((item, index) => {
      const padding = index * 5 + 2;
      item.x = -item.width / 2 + padding;
      item.y = -item.height / 2 + padding;
    });

    source.parent.destroy();
    piles.delete(sourceId);

    createRBush();
  };

  const mergeMultiPiles = pileIds => {
    const targetId = Math.min(...pileIds);
    // const targetPile = piles.get(targetId);
    let centerX = 0;
    let centerY = 0;
    pileIds.forEach(id => {
      const box = piles.get(id).pileBox;
      centerX += box.minX + (box.maxX - box.minX) / 2;
      centerY += box.minY + (box.maxY - box.minY) / 2;
    });
    pileIds.forEach(id => {
      if (id !== targetId) {
        mergePile(id, targetId);
      }
    });
    centerX /= pileIds.length;
    centerY /= pileIds.length;
    piles.get(targetId).pileGraphics.x = centerX;
    piles.get(targetId).pileGraphics.y = centerY;

    createRBush();
  };

  const LASSO_MIN_DIST = 8;
  const LASSO_MIN_DELAY = 25;
  // let lasso;
  let lassoPos = [];
  let lassoPosFlat = [];
  let lassoPrevMousePos;
  // let lassoFirstPos;
  let isLasso = false;

  const lassoExtend = () => {
    const currMousePos = getMousePos();

    if (!lassoPrevMousePos) {
      lassoPos.push(currMousePos);
      lassoPosFlat.push(...currMousePos);
      lassoPrevMousePos = currMousePos;
      // lassoFirstPos = currMousePos;
      lasso.lineStyle(2, 0xffffff, 1);
      // lassoFill.lineStyle(2, 0xffffff, 1);
      // lassoFill.beginFill(0xffffff);
      lasso.moveTo(...currMousePos);
      lassoFill.moveTo(...currMousePos);
    } else {
      const d = dist(...currMousePos, ...lassoPrevMousePos);

      if (d > LASSO_MIN_DIST) {
        lassoPos.push(currMousePos);
        lassoPosFlat.push(...currMousePos);
        lassoPrevMousePos = currMousePos;
        if (lassoPos.length > 1) {
          lassoPos.forEach(pos => {
            lasso.lineTo(...pos);
            lasso.moveTo(...pos);
            // lassoFill.lineTo(...pos);
            // lassoFill.moveTo(...pos);
            renderRaf();
            isLasso = true;
          });
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
      // console.log(pilesInLasso);
      if (pilesInLasso.length > 1) {
        mergeMultiPiles(pilesInLasso);
      }
      // lasso.lineStyle(2, 0xffffff, 1);
      // lasso.moveTo(...lassoPos[lassoPos.length-1])
      // lasso.lineTo(...lassoFirstPos);
      lasso.closePath();
      lasso.clear();
      // lassoFill.moveTo(...lassoPos[lassoPos.length-1])
      // lassoFill.lineTo(...lassoFirstPos);
      // lassoFill.closePath();
      // lassoFill.endFill();
      render();
      isLasso = false;
    }
    // lassoFill.clear();
    // render();
    lassoPos = [];
    lassoPosFlat = [];
    lassoPrevMousePos = undefined;
  };

  const handleDropPile = pileId => {
    let hit;
    const pile = piles.get(pileId).pileGraphics;

    createRBush();
    const result = searchIndex.search(piles.get(pileId).pileBox);

    // only one pile is colliding with the pile
    if (result.length === 2) {
      result.forEach(collidePile => {
        if (collidePile.pileId !== pileId) {
          mergePile(pileId, collidePile.pileId);
          hit = true;
        }
      });
    }

    // if (piles) {
    //   // eslint-disable-next-line no-restricted-syntax
    //   for (const [id, targetPile] of piles.entries()) {
    //     if (pileId !== id) {
    //       hit = hitTestRectangle(pile, targetPile.pileGraphics);
    //       if (hit === true) {
    //         targetId = id;
    //         break;
    //       }
    //     }
    //   }
    //   if (hit === true) {
    //     mergePile(pileId, targetId);
    //   }
    // }

    activePile.removeChildren();
    // if hit = true, then the original pile is destoryed
    if (hit !== true) {
      normalPile.addChild(pile);
    }
  };

  const handleDragPile = pileId => {
    const pile = piles.get(pileId).pileGraphics;
    activePile.addChild(pile);
  };

  let oldResult = [];
  let newResult = [];

  const handleHighlightPile = pileId => {
    createRBush();

    oldResult = [...newResult];

    newResult = searchIndex.search(piles.get(pileId).pileBox);

    if (oldResult !== []) {
      oldResult.forEach(collidePile => {
        if (piles.get(collidePile.pileId)) {
          const pile = piles.get(collidePile.pileId).pileGraphics;
          const border = pile.getChildAt(0).getChildAt(0);
          border.clear();
        }
      });
    }

    newResult.forEach(collidePile => {
      if (piles.get(collidePile.pileId)) {
        const pile = piles.get(collidePile.pileId).pileGraphics;
        const border = pile.getChildAt(0).getChildAt(0);
        piles.get(collidePile.pileId).drawBorder(pile, border);
      }
    });
  };

  let mouseDown = false;
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
    // const currentMousePosition = [event.clientX, event.clientY];
    // const clickDist = dist(...currentMousePosition, ...mouseDownPosition);

    // if (clickDist >= LASSO_MIN_DIST) return;
    getRelativeMousePosition(event);
  };

  const mouseMoveHandler = event => {
    getRelativeMousePosition(event);

    if (mouseDown) {
      lassoExtendDb();
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
    canvas.addEventListener('dblclick', () => {}, false);

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
    canvas.removeEventListener('dblclick', () => {}, false);

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
