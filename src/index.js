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
  depilePiles,
  setItemRenderer,
  setItems,
  setOrderer,
  setGrid,
  setItemSizeRange,
  setItemAlignment,
  setItemRotated,
  setClickedPile,
  setScaledPile,
  setDepiledPile,
  setTemporaryDepiledPile,
  setTempDepileDirection,
  settempDepileOneDNum
} from './store';

import { dist, getBBox, isPileInPolygon } from './utils';

import createPile from './pile';
import createGrid from './grid';
import createItem from './item';

const convolve = require('ndarray-convolve');
const ndarray = require('ndarray');

const createPileMe = rootElement => {
  const scrollContainer = document.createElement('div');

  const canvas = document.createElement('canvas');
  const pubSub = createPubSub();
  const store = createStore();

  let state = store.getState();

  let gridMat;

  const renderer = new PIXI.Renderer({
    width: rootElement.getBoundingClientRect().width,
    height: rootElement.getBoundingClientRect().height,
    view: canvas,
    antialias: true,
    transparent: true,
    resolution: window.devicePixelRatio,
    autoResize: true
  });

  const root = new PIXI.Container();
  root.interactive = true;

  const stage = new PIXI.Container();
  stage.interactive = true;
  stage.sortableChildren = true;

  const gridGfx = new PIXI.Graphics();
  root.addChild(gridGfx);

  root.addChild(stage);

  const mask = new PIXI.Graphics();
  root.addChild(mask);
  stage.mask = mask;

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

      case 'clickedPile':
        return state.clickedPile;

      case 'scaledPile':
        return state.scaledPile;

      case 'depiledPile':
        return state.depiledPile;

      case 'temporaryDepiledPile':
        return state.temporaryDepiledPile;

      case 'tempDepileDirection':
        return state.tempDepileDirection;

      case 'tempDepileOneDNum':
        return state.tempDepileOneDNum;

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

      case 'clickedPile':
        actions.push(setClickedPile(value));
        break;

      case 'scaledPile':
        actions.push(setScaledPile(value));
        break;

      case 'depiledPile':
        actions.push(setDepiledPile(value));
        break;

      case 'temporaryDepiledPile':
        actions.push(setTemporaryDepiledPile(value));
        break;

      case 'tempDepileDirection':
        actions.push(setTempDepileDirection(value));
        break;

      case 'tempDepileOneDNum':
        actions.push(settempDepileOneDNum(value));
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
    renderer.render(root);
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

  let layout;

  const updateScrollContainer = () => {
    scrollContainer.style.height = `${layout.myRowHeight * layout.myRowNum +
      canvas.getBoundingClientRect().height}px`;
  };

  const initGrid = () => {
    const { grid } = store.getState();

    layout = createGrid(canvas, grid);
    updateScrollContainer();
    gridMat = layout.mat;

    // gridGfx.clear();
    // gridGfx.lineStyle(2, 0xffd900, 1);
    // for(let i = 0; i < layout.myColNum; i++){
    //   gridGfx.moveTo(i * layout.myColWidth, 0);
    //   gridGfx.lineTo(i * layout.myColWidth, layout.myRowNum * layout.myRowHeight);
    // }
    // for(let i = 0; i < layout.myRowNum; i++){
    //   gridGfx.moveTo(0, i * layout.myRowHeight);
    //   gridGfx.lineTo(layout.myColNum * layout.myColWidth, i * layout.myRowHeight);
    // }
  };

  const updateBoundingBox = pileId => {
    const pile = pileInstances.get(pileId);

    searchIndex.remove(pile.bBox, (a, b) => {
      return a.pileId === b.pileId;
    });
    pile.updateBBox();
    searchIndex.insert(pile.bBox);
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

        renderedItems.get(id).originalPosition = [x, y];

        movingPiles.push({
          id,
          x: pile.pileGraphics.x,
          y: pile.pileGraphics.y
        });
      });
      if (movingPiles.length !== 0) store.dispatch(movePiles(movingPiles));
      createRBush();
      renderRaf();
    }
  };

  const positionItems = pileId => {
    const { itemAlignment, itemRotated } = store.getState();

    pileInstances.get(pileId).positionItems(itemAlignment, itemRotated);
  };

  const updatePileItems = (pile, id) => {
    if (pileInstances.has(id)) {
      const pileInstance = pileInstances.get(id);
      if (pile.items.length === 0) {
        deleteSearchIndex(id);
        pileInstance.destroy();
        pileInstances.delete(id);
      } else {
        pileInstance.itemContainer.removeChildren();
        pile.items.forEach(itemId => {
          pileInstance.itemContainer.addChild(renderedItems.get(itemId).sprite);
          if (!pileInstance.itemIds.has(itemId)) {
            pileInstance.newItemIds.set(
              itemId,
              renderedItems.get(itemId).sprite
            );
          }
        });
        positionItems(id);
        updateBoundingBox(id);
      }
    } else {
      const newPile = createPile(
        renderedItems.get(id).sprite,
        renderRaf,
        id,
        pubSub
      );
      pileInstances.set(id, newPile);
      normalPile.addChild(newPile.pileGraphics);
      updateBoundingBox(id);
    }
  };

  const updatePileLocation = (pile, id) => {
    if (pileInstances.has(id)) {
      const pileGraphics = pileInstances.get(id).pileGraphics;
      pileGraphics.x = pile.x;
      pileGraphics.y = pile.y;
      updateBoundingBox(id);
    }
  };

  const updateGridMat = pileId => {
    for (let i = 0; i < gridMat.shape[0]; i++) {
      for (let j = 0; j < gridMat.shape[1]; j++) {
        gridMat.set(i, j, 0);
      }
    }

    pileInstances.forEach(pile => {
      if (pile.id === pileId) return;

      const bBox = pile.bBox;
      const minY = Math.floor(bBox.minX / layout.myColWidth);
      const minX = Math.floor(bBox.minY / layout.myRowHeight);
      const maxY = Math.floor(bBox.maxX / layout.myColWidth);
      const maxX = Math.floor(bBox.maxY / layout.myRowHeight);
      gridMat.set(minX, minY, 1);
      gridMat.set(minX, maxY, 1);
      gridMat.set(maxX, minY, 1);
      gridMat.set(maxX, maxY, 1);
    });
  };

  const next = (distanceMat, current) => {
    let nextPos; // top
    let min = Infinity; // top

    // top
    if (
      current[0] - 1 >= 0 &&
      distanceMat.get(current[0] - 1, current[1]) < min
    ) {
      min = distanceMat.get(current[0] - 1, current[1]);
      nextPos = [current[0] - 1, current[1]];
    }

    // left
    if (
      current[1] - 1 >= 0 &&
      distanceMat.get(current[0], current[1] - 1) < min
    ) {
      min = distanceMat.get(current[0], current[1] - 1);
      nextPos = [current[0], current[1] - 1];
    }

    // bottom
    if (
      current[0] + 1 < distanceMat.shape[0] &&
      distanceMat.get(current[0] + 1, current[1]) < min
    ) {
      min = distanceMat.get(current[0] + 1, current[1]);
      nextPos = [current[0] + 1, current[1]];
    }

    // right
    if (
      current[1] + 1 < distanceMat.shape[1] &&
      distanceMat.get(current[0], current[1] + 1) < min
    ) {
      min = distanceMat.get(current[0], current[1] + 1);
      nextPos = [current[0], current[1] + 1];
    }

    const length = distanceMat.data.length;
    distanceMat.set(current[0], current[1], length);

    if (min === distanceMat.data.length) {
      for (let i = 0; i < distanceMat.shape[0]; i++) {
        for (let j = 0; j < distanceMat.shape[1]; j++) {
          if (distanceMat.get(i, j) < min && distanceMat.get(i, j) > 0)
            min = distanceMat.get(i, j);
          nextPos = [i, j];
        }
      }
    }

    return nextPos;
  };

  const calcDist = (distanceMat, x, y, origin) => {
    if (distanceMat.get(x, y) !== -1) return;

    const distance = dist(x, y, origin[0], origin[1]);
    distanceMat.set(x, y, distance);
  };

  const findDepilePos = (distanceMat, resultMat, origin, filterRowNum) => {
    let current = [...origin];

    let depilePos;
    let count = 0;

    while (!depilePos && count < distanceMat.data.length) {
      // check current
      if (resultMat.get(current[0], current[1]) < 1) depilePos = current;

      if (!depilePos) {
        // calc dist

        // top
        if (current[0] - 1 >= 0) {
          calcDist(distanceMat, current[0] - 1, current[1], origin);
        }
        // left
        if (current[1] - 1 >= 0) {
          calcDist(distanceMat, current[0], current[1] - 1, origin);
        }
        // bottom
        if (current[0] + 1 < distanceMat.shape[0]) {
          calcDist(distanceMat, current[0] + 1, current[1], origin);
        }
        // right
        if (current[1] + 1 < distanceMat.shape[1]) {
          calcDist(distanceMat, current[0], current[1] + 1, origin);
        }

        // get closest cell
        current = next(distanceMat, current);
        count++;
      }
    }

    // doesn't find a available cell
    if (!depilePos) {
      depilePos = [resultMat.shape[0], 0];
      layout.myRowNum += filterRowNum;
      updateScrollContainer();
    }

    return depilePos;
  };

  const convolveGridMat = (filterColNum, filterRowNum) => {
    const filter = ndarray(
      new Float32Array(new Array(filterColNum * filterRowNum).fill(1)),
      [filterRowNum, filterColNum]
    );

    const resultMat = ndarray(
      new Float32Array(
        (layout.myRowNum - filterRowNum + 1) *
          (layout.myColNum - filterColNum + 1)
      ),
      [layout.myRowNum - filterRowNum + 1, layout.myColNum - filterColNum + 1]
    );

    convolve(resultMat, gridMat, filter);

    return resultMat;
  };

  const findPos = (origin, colNum, rowNum) => {
    const resultMat = convolveGridMat(colNum, rowNum);

    const distanceMat = ndarray(
      new Float32Array(
        new Array(
          (layout.myRowNum - rowNum + 1) * (layout.myColNum - colNum + 1)
        ).fill(-1)
      ),
      [layout.myRowNum - rowNum + 1, layout.myColNum - colNum + 1]
    );

    const depilePos = findDepilePos(distanceMat, resultMat, origin, rowNum);
    const distance = dist(depilePos[0], depilePos[1], origin[0], origin[1]);

    return { depilePos, distance };
  };

  const depile = pileId => {
    const itemNum = pileInstances.get(pileId).itemContainer.children.length;

    if (itemNum === 1) return;

    updateGridMat(pileId);

    // take the center point of pile as the original pos
    const bBox = pileInstances.get(pileId).bBox;
    const centerY = Math.floor(
      (bBox.minX + bBox.maxX) / (layout.myColWidth * 2)
    );
    const centerX = Math.floor(
      (bBox.minY + bBox.maxY) / (layout.myRowHeight * 2)
    );

    const origin = [centerX, centerY];

    const colNum = Math.ceil(Math.sqrt(itemNum));
    const rowNum = Math.ceil(itemNum / colNum);

    let depilePos;
    let filterRowNum;
    let filterColNum;

    if (colNum !== rowNum) {
      const result1 = findPos(origin, colNum, rowNum);
      const result2 = findPos(origin, rowNum, colNum);

      depilePos =
        result1.distance > result2.distance
          ? result2.depilePos
          : result1.depilePos;
      filterColNum = result1.distance > result2.distance ? rowNum : colNum;
      filterRowNum = result1.distance > result2.distance ? colNum : rowNum;
    } else {
      depilePos = findPos(origin, colNum, rowNum).depilePos;
      filterColNum = colNum;
      filterRowNum = rowNum;
    }

    const { piles } = store.getState();
    const depiledPiles = [];
    const items = [...piles[pileId].items];
    const itemPositions = [];
    for (let i = 0; i < items.length; i++) {
      const x =
        Math.floor(i / filterColNum) +
        depilePos[0] -
        Math.floor((filterRowNum - 1) / 2);
      const y =
        (i % filterColNum) + depilePos[1] - Math.floor((filterColNum - 1) / 2);
      itemPositions.push([y * layout.myColWidth, x * layout.myRowHeight]);
    }
    const depiledPile = {
      items,
      itemPositions
    };
    depiledPiles.push(depiledPile);
    store.dispatch(depilePiles(depiledPiles));
    store.dispatch(setDepiledPile([]));
  };

  const tempDepileOneD = (
    temporaryDepileContainer,
    pile,
    tempDepileDirection,
    items
  ) => {
    if (tempDepileDirection === 'horizontal') {
      temporaryDepileContainer.x = pile.bBox.maxX - pile.bBox.minX + 10;
      temporaryDepileContainer.y = 0;
      temporaryDepileContainer.interactive = true;

      let widths = 0;
      items.forEach((itemId, index) => {
        const clonedSprite = renderedItems.get(itemId).cloneSprite();
        temporaryDepileContainer.addChild(clonedSprite);
        clonedSprite.x = index * 5 + widths;
        clonedSprite.y = 0;
        widths += clonedSprite.width;
      });
    } else if (tempDepileDirection === 'vertical') {
      temporaryDepileContainer.x = 0;
      temporaryDepileContainer.y = pile.bBox.maxY - pile.bBox.minY + 10;
      temporaryDepileContainer.interactive = true;

      let heights = 0;
      items.forEach((itemId, index) => {
        const clonedSprite = renderedItems.get(itemId).cloneSprite();
        temporaryDepileContainer.addChild(clonedSprite);
        clonedSprite.x = 0;
        clonedSprite.y = index * 5 + heights;
        heights += clonedSprite.height;
      });
    }
  };

  const tempDepileTwoD = (temporaryDepileContainer, pile, items, orderer) => {
    temporaryDepileContainer.x = pile.bBox.maxX - pile.bBox.minX + 10;
    temporaryDepileContainer.y = 0;
    temporaryDepileContainer.interactive = true;

    const squareLength = Math.ceil(Math.sqrt(items.length));

    items.forEach((itemId, index) => {
      const clonedSprite = renderedItems.get(itemId).cloneSprite();
      temporaryDepileContainer.addChild(clonedSprite);
      const getPosition = orderer(squareLength);
      let x;
      let y;
      [x, y] = getPosition(index);
      x *= layout.myColWidth;
      y *= layout.myRowHeight;
      clonedSprite.x = x;
      clonedSprite.y = y;
    });
  };

  const temporaryDepile = pileIds => {
    pileIds.forEach(pileId => {
      const pile = pileInstances.get(pileId);

      if (pile.isTempDepiled[0]) {
        pileInstances.forEach(otherPile => {
          otherPile.pileGraphics.alpha = 1;
        });
        const length = pile.itemContainer.children.length;
        pile.itemContainer.removeChildAt(length - 1);
        pile.isTempDepiled[0] = false;
        pile.border.clear();
        pile.isFocus[0] = false;
      } else {
        const temporaryDepileContainer = new PIXI.Container();
        pile.itemContainer.addChild(temporaryDepileContainer);

        pileInstances.forEach(otherPile => {
          otherPile.pileGraphics.alpha = 0.3;
        });

        pile.pileGraphics.alpha = 1;

        const {
          piles,
          tempDepileDirection,
          tempDepileOneDNum,
          orderer
        } = store.getState();

        const items = [...piles[pileId].items];

        if (items.length < tempDepileOneDNum) {
          tempDepileOneD(
            temporaryDepileContainer,
            pile,
            tempDepileDirection,
            items
          );
        } else {
          tempDepileTwoD(temporaryDepileContainer, pile, items, orderer);
        }
        pile.isTempDepiled[0] = true;
      }
      updateBoundingBox(pileId);
    });
    renderRaf();
  };

  let mousePosition = [0, 0];

  // Get a copy of the current mouse position
  const getMousePos = () => mousePosition.slice();

  const getRelativeMousePosition = event => {
    const rect = canvas.getBoundingClientRect();

    mousePosition[0] = event.clientX - rect.left;
    mousePosition[1] = event.clientY - rect.top - stage.y;

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
        store.dispatch(setClickedPile([]));
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
    const pile = pileInstances.get(pileId);
    if (pile.scale(wheelDelta)) {
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
      // console.log(state.piles, newState.piles)
      if (state.piles.length !== 0) {
        newState.piles.forEach((pile, id) => {
          if (pile.items.length !== state.piles[id].items.length) {
            updatePileItems(pile, id);
          }
          if (
            (pile.x !== state.piles[id].x || pile.y !== state.piles[id].y) &&
            pile.items.length !== 0
          ) {
            updatePileLocation(pile, id);
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

    if (state.tempDepileDirection !== newState.tempDepileDirection) {
      console.log(newState.tempDepileDirection);
      stateUpdates.add('layout');
    }

    if (state.tempDepileOneDNum !== newState.tempDepileOneDNum) {
      console.log(newState.tempDepileOneDNum);
      stateUpdates.add('layout');
    }

    if (state.temporaryDepiledPile !== newState.temporaryDepiledPile) {
      console.log(newState.temporaryDepiledPile);
      if (newState.temporaryDepiledPile.length !== 0) {
        if (state.temporaryDepiledPile.length !== 0) {
          temporaryDepile(state.temporaryDepiledPile);
        }
        temporaryDepile(newState.temporaryDepiledPile);
      } else {
        temporaryDepile(state.temporaryDepiledPile);
      }
    }

    if (state.clickedPile !== newState.clickedPile) {
      if (newState.clickedPile.length !== 0) {
        const newPile = pileInstances.get(newState.clickedPile[0]);
        if (newPile.isTempDepiled[0]) {
          newPile.drawBorder(3, 0xe87a90);
        } else {
          newPile.drawBorder(2, 0xfeeb77);
        }
        newPile.isFocus[0] = true;
        if (state.clickedPile.length !== 0) {
          if (pileInstances.has(state.clickedPile[0])) {
            const oldPile = pileInstances.get(state.clickedPile[0]);
            if (!oldPile.isTempDepiled[0]) {
              oldPile.border.clear();
              oldPile.isFocus[0] = false;
            }
          }
        }
      } else if (pileInstances.has(state.clickedPile[0])) {
        const pile = pileInstances.get(state.clickedPile[0]);
        if (!pile.isTempDepiled[0]) {
          pile.border.clear();
          pile.isFocus[0] = false;
        }
      }
      renderRaf();
    }

    if (state.scaledPile !== newState.scaledPile) {
      if (state.scaledPile.length !== 0) {
        if (pileInstances.has(state.scaledPile[0])) {
          const pile = pileInstances.get(state.scaledPile[0]).pileGraphics;
          pile.scale.x = 1;
          pile.scale.y = 1;
          updateBoundingBox(state.scaledPile[0]);
          activePile.removeChildren();
          normalPile.addChild(pile);
        }
      }
      renderRaf();
    }

    if (state.depiledPile !== newState.depiledPile) {
      console.log(newState.depiledPile);
      if (newState.depiledPile.length !== 0) depile(newState.depiledPile[0]);
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

    if (pile.x !== pile.beforeDragX || pile.y !== pile.beforeDragY) {
      const collidePiles = searchIndex
        .search(pileInstances.get(pileId).calcBBox())
        .filter(collidePile => collidePile.pileId !== pileId);

      // only one pile is colliding with the pile
      if (collidePiles.length === 1) {
        store.dispatch(setTemporaryDepiledPile([]));
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
        pile.drawBorder(1, 0x91989f);
      }
    });
  };

  let mouseClickShift = false;
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
    if (mouseClickShift) mouseClickShift = false;
  };

  const mouseClickHandler = event => {
    // const { piles } = store.getState();

    getRelativeMousePosition(event);

    mouseClickShift = event.shiftKey;

    const result = searchIndex.search({
      minX: mouseDownPosition[0],
      minY: mouseDownPosition[1],
      maxX: mouseDownPosition[0] + 1,
      maxY: mouseDownPosition[1] + 1
    });

    if (result.length !== 0) {
      if (mouseClickShift) {
        // const depiledPiles = [];
        // const items = [...piles[result[0].pileId].items];
        // const itemPositions = [];
        // items.forEach(itemId => {
        //   itemPositions.push([...renderedItems.get(itemId).originalPosition]);
        // });
        // const depiledPile = {
        //   items,
        //   itemPositions
        // };
        // depiledPiles.push(depiledPile);
        // store.dispatch(depilePiles(depiledPiles));
        store.dispatch(setDepiledPile([result[0].pileId]));
        store.dispatch(setClickedPile([]));
      } else {
        store.dispatch(setClickedPile([result[0].pileId]));
      }
    } else {
      store.dispatch(setClickedPile([]));
      store.dispatch(setScaledPile([]));
    }
  };

  const mouseMoveHandler = event => {
    mousePosition = getRelativeMousePosition(event);

    lassoExtendDb();
  };

  const mouseDblClickHandler = event => {
    getRelativeMousePosition(event);

    const { temporaryDepiledPile, piles } = store.getState();

    const result = searchIndex.search({
      minX: mouseDownPosition[0],
      minY: mouseDownPosition[1],
      maxX: mouseDownPosition[0] + 1,
      maxY: mouseDownPosition[1] + 1
    });

    if (result.length !== 0) {
      if (piles[result[0].pileId].items.length > 1) {
        let temp = [...temporaryDepiledPile];
        if (temp.includes(result[0].pileId)) {
          temp = temp.filter(id => id !== result[0].pileId);
        } else {
          temp.push(result[0].pileId);
        }
        store.dispatch(setTemporaryDepiledPile([...temp]));
        store.dispatch(setClickedPile([]));
        store.dispatch(setClickedPile([result[0].pileId]));
      }
    } else {
      store.dispatch(setTemporaryDepiledPile([]));
      store.dispatch(setClickedPile([]));
    }
  };

  const mouseWheelHandler = event => {
    getRelativeMousePosition(event);

    const result = searchIndex.search({
      minX: mousePosition[0],
      minY: mousePosition[1],
      maxX: mousePosition[0] + 1,
      maxY: mousePosition[1] + 1
    });

    if (result.length !== 0) {
      event.preventDefault();
      store.dispatch(setScaledPile([result[0].pileId]));
      const normalizedDeltaY = normalizeWheel(event).pixelY;
      scalePile(result[0].pileId, normalizedDeltaY);
      const pileGraphics = pileInstances.get(result[0].pileId).pileGraphics;
      activePile.addChild(pileGraphics);
    }
  };

  const mouseScrollHandler = () => {
    stage.y = -rootElement.scrollTop;
    renderRaf();
  };

  const init = () => {
    // Setup event handler
    window.addEventListener('blur', () => {}, false);
    window.addEventListener('mousedown', mouseDownHandler, false);
    window.addEventListener('mouseup', mouseUpHandler, false);
    window.addEventListener('mousemove', mouseMoveHandler, false);

    rootElement.addEventListener('scroll', mouseScrollHandler, false);

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
    rootElement.appendChild(scrollContainer);

    rootElement.style.overflow = 'auto';
    canvas.style.position = 'sticky';
    canvas.style.top = '0px';
    canvas.style.left = '0px';

    scrollContainer.style.marginTop = `-100%`;

    const { width, height } = canvas.getBoundingClientRect();

    mask
      .beginFill(0xffffff)
      .drawRect(0, 0, width, height)
      .endFill();
  };

  const destroy = () => {
    // Remove event listeners
    window.removeEventListener('keyup', () => {}, false);
    window.removeEventListener('blur', () => {}, false);
    window.removeEventListener('mousedown', mouseDownHandler, false);
    window.removeEventListener('mouseup', mouseUpHandler, false);
    window.removeEventListener('mousemove', mouseMoveHandler, false);

    rootElement.removeEventListener('scroll', mouseScrollHandler, false);

    canvas.removeEventListener('mouseenter', () => {}, false);
    canvas.removeEventListener('mouseleave', () => {}, false);
    canvas.removeEventListener('click', mouseClickHandler, false);
    canvas.removeEventListener('dblclick', mouseDblClickHandler, false);
    canvas.removeEventListener('wheel', mouseWheelHandler, false);

    root.destroy(false);
    renderer.destroy(true);
    store.unsubscribe(updated);

    rootElement.removeChild(canvas);
    rootElement.removeChild(scrollContainer);

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
