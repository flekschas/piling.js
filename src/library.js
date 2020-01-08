import * as PIXI from 'pixi.js';
import createPubSub from 'pub-sub-es';
import withRaf from 'with-raf';
import * as RBush from 'rbush';
import normalizeWheel from 'normalize-wheel';
import { batchActions } from 'redux-batched-actions';
import convolve from 'ndarray-convolve';
import ndarray from 'ndarray';

import createAnimator from './animator';

import createStore, { overwrite, softOverwrite, createAction } from './store';

import {
  capitalize,
  colorToDecAlpha,
  deepClone,
  dist,
  getBBox,
  isPileInPolygon,
  interpolateVector,
  interpolateNumber,
  scaleLinear,
  withThrottleAndDebounce
} from './utils';

import createPile, { MODE_ACTIVE, MODE_SELECTED } from './pile';
import createGrid from './grid';
import createItem from './item';
import createPreview from './preview';
import createTweener from './tweener';
import createContextMenu from './context-menu';

const createPilingJs = (rootElement, initOptions = {}) => {
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
    autoDensity: true
  });

  const root = new PIXI.Container();
  root.interactive = true;

  const stage = new PIXI.Container();
  stage.interactive = true;
  stage.sortableChildren = true;

  const gridGfx = new PIXI.Graphics();
  stage.addChild(gridGfx);

  root.addChild(stage);

  const mask = new PIXI.Graphics();
  root.addChild(mask);
  stage.mask = mask;

  const properties = {
    aggregateRenderer: true,
    backgroundColor: true,
    focusedPiles: true,
    depiledPile: true,
    depileMethod: true,
    easing: true,
    coverAggregator: true,
    grid: true,
    itemOpacity: true,
    items: {
      set: value => [
        createAction.setItems(value),
        createAction.initPiles(value.length)
      ]
    },
    itemSizeRange: true,
    itemAlignment: true,
    itemRotated: true,
    lassoFillColor: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setLassoFillColor(color)];
        if (opacity !== null)
          actions.push(createAction.setLassoFillOpacity(opacity));
        return actions;
      }
    },
    lassoFillOpacity: true,
    lassoStrokeColor: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setLassoStrokeColor(color)];
        if (opacity !== null)
          actions.push(createAction.setLassoStrokeOpacity(opacity));
        return actions;
      }
    },
    lassoStrokeOpacity: true,
    lassoStrokeSize: true,
    orderer: true,
    pileBorderColor: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setPileBorderColor(color)];
        if (opacity !== null)
          actions.push(createAction.setPileBorderOpacity(opacity));
        return actions;
      }
    },
    pileBorderOpacity: true,
    pileBorderColorSelected: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setPileBorderColorSelected(color)];
        if (opacity !== null)
          actions.push(createAction.setPileBorderOpacitySelected(opacity));
        return actions;
      }
    },
    pileBorderOpacitySelected: true,
    pileBorderColorActive: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setPileBorderColorActive(color)];
        if (opacity !== null)
          actions.push(createAction.setPileBorderOpacityActive(opacity));
        return actions;
      }
    },
    pileBorderOpacityActive: true,
    pileBackgroundColor: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setPileBackgroundColor(color)];
        if (opacity !== null)
          actions.push(createAction.setPileBackgroundOpacity(opacity));
        return actions;
      }
    },
    pileBackgroundOpacity: true,
    pileContextMenuItems: true,
    previewAggregator: true,
    previewRenderer: true,
    previewSpacing: true,
    previewBackgroundColor: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setPreviewBackgroundColor(color)];
        if (opacity !== null)
          actions.push(createAction.setPreviewBackgroundOpacity(opacity));
        return actions;
      }
    },
    previewBackgroundOpacity: true,
    renderer: {
      get: 'itemRenderer',
      set: value => [createAction.setItemRenderer(value)]
    },
    scaledPile: true,
    temporaryDepiledPiles: true,
    tempDepileDirection: true,
    tempDepileOneDNum: true
  };

  const get = property => {
    if (properties[property])
      return state[properties[property].get || property];

    console.warn(`Unknown property "${property}"`);
    return undefined;
  };

  const set = (property, value, noDispatch = false) => {
    let actions = [];

    if (properties[property]) {
      const defaultSetter = v => [
        createAction[`set${capitalize(property)}`](v)
      ];
      const setter = properties[property].set || defaultSetter;
      if (setter) {
        actions = setter(value);
      } else {
        console.warn(`Property "${property}" is not settable`);
      }
    } else {
      console.warn(`Unknown property "${property}"`);
    }

    if (!noDispatch) {
      actions.forEach(action => store.dispatch(action));
    }

    return actions;
  };

  const setPublic = (newProperty, newValue) => {
    if (typeof newProperty === 'string' || newProperty instanceof String) {
      set(newProperty, newValue);
    } else {
      store.dispatch(
        batchActions(
          Object.entries(newProperty).flatMap(([property, value]) =>
            set(property, value, true)
          )
        )
      );
    }
  };

  const render = () => {
    renderer.render(root);
    pubSub.publish('render');
  };

  const renderRaf = withRaf(render);

  const animator = createAnimator(render);

  const renderedItems = new Map();
  const pileInstances = new Map();
  const activePile = new PIXI.Container();
  const normalPiles = new PIXI.Container();

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

  const updateScrollContainer = () => {
    const finalHeight = Math.round(layout.rowHeight) * layout.rowNum;
    const canvasHeight = canvas.getBoundingClientRect().height;
    const extraHeight = Math.round(layout.rowHeight) * 3;
    scrollContainer.style.height = `${Math.max(
      0,
      finalHeight - canvasHeight + extraHeight
    )}px`;
  };

  const initGrid = () => {
    const { grid } = store.getState();

    layout = createGrid(canvas, grid);
    updateScrollContainer();
  };

  let scaleSprite;

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

    const minRange = Math.min(layout.colWidth - 4, layout.rowHeight - 4);

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

    scaleSprite = scaleLinear()
      .domain([min, max])
      .range(range);

    renderedItems.forEach(item => {
      const spriteRatio = item.sprite.height / item.sprite.width;

      if (item.sprite.width > item.sprite.height) {
        item.sprite.width = scaleSprite(item.sprite.width);
        item.sprite.height = item.sprite.width * spriteRatio;
      } else {
        item.sprite.height = scaleSprite(item.sprite.height);
        item.sprite.width = item.sprite.height / spriteRatio;
      }

      if (item.preview) {
        const previewSprite = item.preview.previewSprite;
        const previewRatio = previewSprite.height / previewSprite.width;
        previewSprite.width = item.sprite.width;
        previewSprite.height = previewSprite.width * previewRatio;
        item.preview.drawBg(0x000000);
      }
    });
  };

  const lassoContainer = new PIXI.Container();
  const lassoBgContainer = new PIXI.Container();
  const lasso = new PIXI.Graphics();
  const lassoFill = new PIXI.Graphics();

  const createItems = () => {
    const {
      itemRenderer,
      previewRenderer,
      previewAggregator,
      items
    } = store.getState();

    if (!items.length || !itemRenderer) return null;

    renderedItems.forEach(item => {
      item.destroy();
    });
    pileInstances.forEach(pile => {
      pile.destroy();
    });
    renderedItems.clear();
    pileInstances.clear();

    stage.removeChildren();

    stage.addChild(gridGfx);
    stage.addChild(lassoBgContainer);
    lassoBgContainer.addChild(lassoFill);
    stage.addChild(normalPiles);

    const renderItems = itemRenderer(items.map(({ src }) => src));
    const renderPreviews = previewAggregator
      ? previewAggregator(items.map(({ src }) => src)).then(newPreviews => {
          return previewRenderer(newPreviews);
        })
      : Promise.resolve([]);

    return Promise.all([renderItems, renderPreviews]).then(
      ([newRenderedItems, newRenderedPreviews]) => {
        newRenderedItems.forEach((renderedItem, index) => {
          let preview = null;
          if (newRenderedPreviews[index]) {
            preview = createPreview({
              texture: newRenderedPreviews[index],
              store
            });
          }
          const newItem = createItem(index, renderedItem, preview, pubSub);
          renderedItems.set(index, newItem);
          const pile = createPile({
            initialItem: newItem.sprite,
            render: renderRaf,
            id: index,
            pubSub,
            store
          });
          pileInstances.set(index, pile);
          normalPiles.addChild(pile.graphics);
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
          const getPosition = orderer(layout.colNum);
          [x, y] = getPosition(id);
        }

        layout.rowNum = y + 1;

        x *= layout.colWidth;
        y *= layout.rowHeight;

        pile.graphics.x += x;
        pile.graphics.y += y;

        renderedItems.get(id).originalPosition = [x, y];

        movingPiles.push({
          id,
          x: pile.x,
          y: pile.y
        });
      });
      if (movingPiles.length !== 0)
        store.dispatch(createAction.movePiles(movingPiles));
      createRBush();
      updateScrollContainer();
      renderRaf();
    }
  };

  const positionItems = pileId => {
    const { itemAlignment, itemRotated } = store.getState();

    pileInstances
      .get(pileId)
      .positionItems(
        itemAlignment,
        itemRotated,
        animator,
        store.getState().previewSpacing
      );
  };

  const updatePreviewAndCover = (pile, pileInstance) => {
    const { items, coverAggregator, aggregateRenderer } = store.getState();
    if (pile.items.length === 1) {
      pileInstance.itemContainer.addChild(
        renderedItems.get(pile.items[0]).sprite
      );
      pileInstance.hasCover = false;
      positionItems(pileInstance.id);
    } else {
      const itemSrcs = [];
      pile.items.forEach(itemId => {
        itemSrcs.push(items[itemId].src);
        const preview = renderedItems.get(itemId).preview.previewContainer;
        preview.x = 2;
        preview.y = 0;
        pileInstance.itemContainer.addChild(preview);
      });

      coverAggregator(itemSrcs)
        .then(newSrc => aggregateRenderer([newSrc]))
        .then(newCover => {
          const cover = new PIXI.Sprite(newCover[0]);
          cover.x = 2;
          cover.y = 2;
          cover.width = scaleSprite(cover.width);
          cover.height = scaleSprite(cover.height);
          pileInstance.itemContainer.addChild(cover);
          pileInstance.hasCover = true;
          positionItems(pileInstance.id);
        });
    }
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
        if (store.getState().previewAggregator) {
          updatePreviewAndCover(pile, pileInstance);
        } else {
          if (pile.items.length === 1) {
            pileInstance.itemsById.clear();
            pileInstance.itemsById.set(
              pile.items[0],
              renderedItems.get(pile.items[0]).sprite
            );
          }
          pile.items.forEach(itemId => {
            pileInstance.itemContainer.addChild(
              renderedItems.get(itemId).sprite
            );
            if (!pileInstance.itemsById.has(itemId)) {
              pileInstance.newItemsById.set(
                itemId,
                renderedItems.get(itemId).sprite
              );
            }
          });
          positionItems(id);
        }
        updateBoundingBox(id);
        pileInstance.border.clear();
      }
    } else {
      const newPile = createPile({
        initialItem: renderedItems.get(id).sprite,
        render: renderRaf,
        id,
        pubSub,
        store
      });
      pileInstances.set(id, newPile);
      normalPiles.addChild(newPile.graphics);
      updateBoundingBox(id);
    }
  };

  const updatePileLocation = (pile, id) => {
    if (pileInstances.has(id)) {
      const graphics = pileInstances.get(id).graphics;
      graphics.x = pile.x;
      graphics.y = pile.y;
      updateBoundingBox(id);
      renderRaf();
    }
  };

  const updateGridMat = pileId => {
    const mat = ndarray(
      new Uint16Array(new Array(layout.colNum * layout.rowNum).fill(0)),
      [layout.rowNum, layout.olNum]
    );

    gridMat = mat;

    pileInstances.forEach(pile => {
      if (pile.id === pileId) return;

      const bBox = pile.bBox;
      const minY = Math.floor(bBox.minX / layout.colWidth);
      const minX = Math.floor(bBox.minY / layout.rowHeight);
      const maxY = Math.floor(bBox.maxX / layout.colWidth);
      const maxX = Math.floor(bBox.maxY / layout.rowHeight);
      gridMat.set(minX, minY, 1);
      gridMat.set(minX, maxY, 1);
      gridMat.set(maxX, minY, 1);
      gridMat.set(maxX, maxY, 1);
    });
  };

  const next = (distanceMat, current) => {
    let nextPos;
    let min = Infinity;

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

    // doesn't find an available cell
    if (!depilePos) {
      depilePos = [resultMat.shape[0] + 1, Math.floor(filterRowNum / 2)];
      layout.rowNum += filterRowNum;
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
        (layout.rowNum - filterRowNum + 1) * (layout.colNum - filterColNum + 1)
      ),
      [layout.rowNum - filterRowNum + 1, layout.olNum - filterColNum + 1]
    );

    convolve(resultMat, gridMat, filter);

    return resultMat;
  };

  const findPos = (origin, colNum, rowNum) => {
    const resultMat = convolveGridMat(colNum, rowNum);

    const distanceMat = ndarray(
      new Float32Array(
        new Array(
          (layout.rowNum - rowNum + 1) * (layout.colNum - colNum + 1)
        ).fill(-1)
      ),
      [layout.rowNum - rowNum + 1, layout.colNum - colNum + 1]
    );

    const depilePos = findDepilePos(distanceMat, resultMat, origin, rowNum);
    const distance = dist(depilePos[0], depilePos[1], origin[0], origin[1]);

    return { depilePos, distance };
  };

  const animateDepile = (items, itemPositions = []) => {
    const movingPiles = [];
    items.forEach((itemId, index) => {
      const pile = pileInstances.get(itemId);
      const tweener = createTweener({
        duration: 250,
        delay: 0,
        interpolator: interpolateVector,
        endValue:
          itemPositions.length > 0
            ? itemPositions[index]
            : renderedItems.get(itemId).originalPosition,
        getter: () => {
          return [pile.x, pile.y];
        },
        setter: xy => {
          pile.moveTo(...xy);
        },
        onDone: finalValue => {
          movingPiles.push({
            id: itemId,
            x: finalValue[0],
            y: finalValue[1]
          });
          // when animation is done, dispatch move piles
          if (index === items.length - 1) {
            store.dispatch(createAction.movePiles(movingPiles));
          }
        }
      });
      animator.add(tweener);
    });
  };

  const depile = pileId => {
    const itemNum = pileInstances.get(pileId).itemContainer.children.length;

    if (itemNum === 1) return;

    updateGridMat(pileId);

    // take the center point of pile as the original pos
    const bBox = pileInstances.get(pileId).bBox;
    const centerY = Math.floor((bBox.minX + bBox.maxX) / (layout.colWidth * 2));
    const centerX = Math.floor(
      (bBox.minY + bBox.maxY) / (layout.rowHeight * 2)
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
      itemPositions.push([y * layout.colWidth, x * layout.rowHeight]);
    }
    // starts from the depiled pile's position
    const depiledPile = {
      items,
      x: piles[pileId].x,
      y: piles[pileId].y
    };
    depiledPiles.push(depiledPile);
    store.dispatch(createAction.depilePiles(depiledPiles));
    animateDepile(items, itemPositions);
    store.dispatch(createAction.setDepiledPile([]));
  };

  const depileToOriginPos = pileId => {
    const { piles } = store.getState();

    const depiledPiles = [];
    const items = [...piles[pileId].items];

    // starts from the depiled pile's position
    const depiledPile = {
      items,
      x: piles[pileId].x,
      y: piles[pileId].y
    };
    depiledPiles.push(depiledPile);
    store.dispatch(createAction.depilePiles(depiledPiles));
    animateDepile(items);
  };

  const animateTempDepile = (clonedSprite, pile, x, y, isLastOne) => {
    const tweener = createTweener({
      duration: 250,
      interpolator: interpolateVector,
      endValue: [x, y],
      getter: () => {
        return [clonedSprite.x, clonedSprite.y];
      },
      setter: newValue => {
        clonedSprite.x = newValue[0];
        clonedSprite.y = newValue[1];
      },
      onDone: () => {
        if (isLastOne) {
          pile.isTempDepiled = true;
          store.dispatch(createAction.setFocusedPiles([]));
          store.dispatch(createAction.setFocusedPiles([pile.id]));
        }
      }
    });
    animator.add(tweener);
  };

  const animateCloseTempDepile = (clonedSprite, x, y, isLastOne) => {
    const tweener = createTweener({
      duration: 250,
      interpolator: interpolateVector,
      endValue: [x, y],
      getter: () => {
        return [clonedSprite.x, clonedSprite.y];
      },
      setter: newValue => {
        clonedSprite.x = newValue[0];
        clonedSprite.y = newValue[1];
      },
      onDone: () => {
        if (isLastOne) {
          pubSub.publish('closeTempDepile');
        }
      }
    });
    animator.add(tweener);
  };

  const animateAlpha = (graphics, endValue) => {
    const tweener = createTweener({
      duration: 250,
      interpolator: interpolateNumber,
      endValue,
      getter: () => {
        return graphics.alpha;
      },
      setter: newValue => {
        graphics.alpha = newValue;
      }
    });
    animator.add(tweener);
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
        clonedSprite.x = -temporaryDepileContainer.x;
        temporaryDepileContainer.addChild(clonedSprite);
        animateTempDepile(
          clonedSprite,
          pile,
          index * 5 + widths,
          0,
          index === items.length - 1
        );
        widths += clonedSprite.width;
      });
    } else if (tempDepileDirection === 'vertical') {
      temporaryDepileContainer.x = 0;
      temporaryDepileContainer.y = pile.bBox.maxY - pile.bBox.minY + 10;
      temporaryDepileContainer.interactive = true;

      let heights = 0;
      items.forEach((itemId, index) => {
        const clonedSprite = renderedItems.get(itemId).cloneSprite();
        clonedSprite.y = -temporaryDepileContainer.y;
        temporaryDepileContainer.addChild(clonedSprite);
        animateTempDepile(
          clonedSprite,
          pile,
          0,
          index * 5 + heights,
          index === items.length - 1
        );
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
      clonedSprite.x = -temporaryDepileContainer.x;
      temporaryDepileContainer.addChild(clonedSprite);
      const getPosition = orderer(squareLength);
      let x;
      let y;
      [x, y] = getPosition(index);
      x *= layout.colWidth;
      y *= layout.rowHeight;
      animateTempDepile(clonedSprite, pile, x, y, index === items.length - 1);
    });
  };

  let closeTempDepileEvent;

  const temporaryDepile = pileIds => {
    pileIds.forEach(pileId => {
      const pile = pileInstances.get(pileId);

      if (pile.isTempDepiled) {
        const length = pile.itemContainer.children.length;
        const temporaryDepileContainer = pile.itemContainer.getChildAt(
          length - 1
        );
        temporaryDepileContainer.children.forEach((item, index) => {
          animateCloseTempDepile(
            item,
            -temporaryDepileContainer.x,
            -temporaryDepileContainer.y,
            index === temporaryDepileContainer.children.length - 1,
            pile,
            length
          );
        });
        if (closeTempDepileEvent) pubSub.unsubscribe(closeTempDepileEvent);

        closeTempDepileEvent = pubSub.subscribe('closeTempDepile', () => {
          if (pile.isTempDepiled) {
            pile.itemContainer.removeChildAt(length - 1);
            pile.isTempDepiled = false;
            pile.border.clear();
            pile.isFocus = false;
            // eslint-disable-next-line no-use-before-define
            handleHighlightPile({ pileId });
            store.dispatch(createAction.setFocusedPiles([]));
          }
        });
        pubSub.publish('pileInactive', { pile });
      } else {
        const temporaryDepileContainer = new PIXI.Container();
        pile.itemContainer.addChild(temporaryDepileContainer);

        animateAlpha(pile.graphics, 1);
        pile.graphics.interactive = true;

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
        pubSub.publish('pileActive', { pile });
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
    const {
      lassoFillColor,
      lassoFillOpacity,
      lassoStrokeColor,
      lassoStrokeOpacity,
      lassoStrokeSize
    } = store.getState();

    lasso.clear();
    lassoFill.clear();
    lasso.lineStyle(lassoStrokeSize, lassoStrokeColor, lassoStrokeOpacity);
    lasso.moveTo(...lassoPos[0]);
    lassoPos.forEach(pos => {
      lasso.lineTo(...pos);
      lasso.moveTo(...pos);
    });
    lassoFill.beginFill(lassoFillColor, lassoFillOpacity);
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
  const lassoExtendDb = withThrottleAndDebounce(
    lassoExtend,
    LASSO_MIN_DELAY,
    LASSO_MIN_DELAY
  );

  const findPilesInLasso = lassoPolygon => {
    const bBox = getBBox(lassoPolygon);
    const pilesInBBox = searchIndex.search(bBox);
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

  const animateMerge = pileIds => {
    const { piles } = store.getState();
    let centerX = 0;
    let centerY = 0;
    pileIds.forEach(id => {
      centerX += piles[id].x;
      centerY += piles[id].y;
    });
    centerX /= pileIds.length;
    centerY /= pileIds.length;

    pileIds.forEach((id, index) => {
      const pile = pileInstances.get(id);
      const tweener = createTweener({
        duration: 250,
        delay: 0,
        interpolator: interpolateVector,
        endValue: [centerX, centerY],
        getter: () => {
          return [pile.x, pile.y];
        },
        setter: xy => {
          pile.moveTo(...xy);
        },
        onDone: () => {
          if (index === pileIds.length - 1) {
            store.dispatch(createAction.mergePiles(pileIds, false));
          }
        }
      });
      animator.add(tweener);
    });
  };

  const lassoEnd = () => {
    if (isLasso) {
      const pilesInLasso = findPilesInLasso(lassoPosFlat);
      if (pilesInLasso.length > 1) {
        store.dispatch(createAction.setFocusedPiles([]));
        animateMerge(pilesInLasso);
      }
      lasso.closePath();
      lasso.clear();
      lassoFill.clear();
      renderRaf();
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

  const updated = () => {
    const newState = store.getState();

    const stateUpdates = new Set();
    const updates = [];

    if (
      state.items !== newState.items ||
      state.itemRenderer !== newState.itemRenderer ||
      state.previewRenderer !== newState.previewRenderer ||
      state.aggregateRenderer !== newState.aggregateRenderer ||
      state.previewAggregator !== newState.previewAggregator ||
      state.coverAggregator !== newState.coverAggregator
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
      stateUpdates.add('layout');
    }

    if (state.tempDepileOneDNum !== newState.tempDepileOneDNum) {
      stateUpdates.add('layout');
    }

    if (state.temporaryDepiledPiles !== newState.temporaryDepiledPiles) {
      if (newState.temporaryDepiledPiles.length !== 0) {
        if (state.temporaryDepiledPiles.length !== 0) {
          temporaryDepile(state.temporaryDepiledPiles);
        }
        pileInstances.forEach(otherPile => {
          animateAlpha(otherPile.graphics, 0.1);
          otherPile.graphics.interactive = false;
        });
        temporaryDepile(newState.temporaryDepiledPiles);
      } else {
        pileInstances.forEach(otherPile => {
          animateAlpha(otherPile.graphics, 1);
          otherPile.graphics.interactive = true;
        });
        temporaryDepile(state.temporaryDepiledPiles);
      }
    }

    if (state.focusedPiles !== newState.focusedPiles) {
      // Unset previously focused pile
      if (pileInstances.has(state.focusedPiles[0])) {
        const pile = pileInstances.get(state.focusedPiles[0]);
        if (!pile.isTempDepiled) {
          pile.border.clear();
          pile.isFocus = false;
        }
      }

      // Set newly focused pile if any
      if (newState.focusedPiles.length !== 0) {
        const pile = pileInstances.get(newState.focusedPiles[0]);
        if (pile.isTempDepiled) {
          pile.drawBorder(3, MODE_ACTIVE);
        } else {
          pile.drawBorder(2, MODE_SELECTED);
        }
        pile.isFocus = true;
        pubSub.publish('pileFocus', { pile });
      } else {
        const pile = pileInstances.get(state.focusedPiles[0]);
        pubSub.publish('pileBlur', { pile });
      }

      renderRaf();
    }

    if (state.scaledPile !== newState.scaledPile) {
      if (state.scaledPile.length !== 0) {
        if (pileInstances.has(state.scaledPile[0])) {
          const pile = pileInstances.get(state.scaledPile[0]).graphics;
          pile.scale.x = 1;
          pile.scale.y = 1;
          updateBoundingBox(state.scaledPile[0]);
          activePile.removeChildren();
          normalPiles.addChild(pile);
        }
      }
      renderRaf();
    }

    if (state.depileMethod !== newState.depileMethod) {
      stateUpdates.add('layout');
    }

    if (state.depiledPile !== newState.depiledPile) {
      if (newState.depiledPile.length !== 0) depile(newState.depiledPile[0]);
    }

    if (state.previewSpacing !== newState.previewSpacing) {
      stateUpdates.add('layout');
    }

    if (updates.length !== 0) {
      Promise.all(updates).then(() => {
        if (stateUpdates.has('piles') || stateUpdates.has('layout')) {
          positionPiles();
        }
      });
    }

    state = newState;

    pubSub.publish('update', { action: store.lastAction });
  };

  const resetPileBorder = () => {
    pileInstances.forEach(pile => {
      if (pile.isFocus) {
        if (pile.isTempDepiled) {
          pile.drawBorder(3, 'Active');
        } else {
          pile.drawBorder(2, 'Selected');
        }
      } else {
        pile.border.clear();
      }
    });
  };

  const exportState = () => {
    const clonedState = deepClone(state);
    clonedState.version = VERSION;
    return clonedState;
  };

  const importState = (newState, overwriteState = false) => {
    if (newState.version !== VERSION) {
      console.warn(
        `The version of the imported state "${newState.version}" doesn't match the library version "${VERSION}". Use at your own risk!`
      );
    }

    delete newState.version;

    if (overwriteState) store.dispatch(overwrite(newState));
    else store.dispatch(softOverwrite(newState));

    resetPileBorder();
  };

  let hit;

  const handleDropPile = ({ pileId }) => {
    hit = false;
    const pile = pileInstances.get(pileId);
    const pileGfx = pile.graphics;

    if (pile.x !== pileGfx.beforeDragX || pile.y !== pileGfx.beforeDragY) {
      const collidePiles = searchIndex
        .search(pileInstances.get(pileId).calcBBox())
        .filter(collidePile => collidePile.pileId !== pileId);

      // only one pile is colliding with the pile
      if (collidePiles.length === 1) {
        hit = !pileInstances.get(collidePiles[0].pileId).isTempDepiled;
        if (hit) {
          pile.itemContainer.children.forEach(item => {
            item.tmpAbsX = pile.x;
            item.tmpAbsY = pile.y;
          });
          store.dispatch(
            createAction.mergePiles([pileId, collidePiles[0].pileId], true)
          );
        }
      } else {
        store.dispatch(
          createAction.movePiles([
            {
              id: pileId,
              x: pile.x,
              y: pile.y
            }
          ])
        );
      }
    }
    // if not colliding, add the pile back to normalPiles container
    if (!hit) {
      normalPiles.addChild(pileGfx);
    }
  };

  let oldResult = [];
  let newResult = [];

  const handleHighlightPile = ({ pileId }) => {
    if (pileInstances.get(pileId).graphics.scale.x > 1.1) return;
    if (store.getState().temporaryDepiledPiles.length) return;

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
        pile.drawBorder();
      }
    });
  };

  const handleDragPile = ({ pileId }) => {
    activePile.addChild(pileInstances.get(pileId).graphics);
    handleHighlightPile({ pileId });
  };

  const hideContextMenu = contextMenuElement => {
    contextMenuElement.style.display = 'none';
    rootElement.removeChild(contextMenuElement);
  };

  const depileBtnClick = (contextMenuElement, pileId) => () => {
    const { depileMethod } = store.getState();

    if (depileMethod === 'originalPos') {
      depileToOriginPos(pileId);
    } else if (depileMethod === 'cloestPos') {
      store.dispatch(createAction.setDepiledPile([pileId]));
    }
    store.dispatch(createAction.setFocusedPiles([]));
    hideContextMenu(contextMenuElement);
  };

  const tempDepileBtnClick = (contextMenuElement, pileId) => () => {
    const { piles, temporaryDepiledPiles } = store.getState();
    if (piles[pileId].items.length > 1) {
      let temp = [...temporaryDepiledPiles];
      if (temp.includes(pileId)) {
        temp = temp.filter(id => id !== pileId);
      } else {
        temp = [pileId];
      }
      store.dispatch(createAction.setTemporaryDepiledPiles([...temp]));
    }
    hideContextMenu(contextMenuElement);
  };

  let isGridShown = false;
  const gridBtnClick = contextMenuElement => () => {
    if (!isGridShown) {
      gridGfx.clear();
      gridGfx.lineStyle(1, 0x787878, 1);
      for (let i = 0; i < layout.colNum; i++) {
        gridGfx.moveTo(i * layout.colWidth, 0);
        gridGfx.lineTo(i * layout.colWidth, layout.rowNum * layout.rowHeight);
      }
      for (let i = 0; i < layout.rowNum; i++) {
        gridGfx.moveTo(0, i * layout.rowHeight);
        gridGfx.lineTo(layout.colNum * layout.colWidth, i * layout.rowHeight);
      }
      isGridShown = true;
    } else {
      gridGfx.clear();
      isGridShown = false;
    }

    hideContextMenu(contextMenuElement);

    renderRaf();
  };

  const scaleBtnBtnClick = (contextMenuElement, pileId) => () => {
    const pile = pileInstances.get(pileId);
    pile.animateScale();

    hideContextMenu(contextMenuElement);
  };

  let mouseDownPosition = [0, 0];

  const mouseDownHandler = event => {
    if (event.button === 0) {
      renderRaf();

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
    }
  };

  const mouseUpHandler = () => {
    if (mouseDown) {
      lassoEnd();
      mouseDown = false;
    }
  };

  let clickMark = false;

  const mouseClickHandler = event => {
    // when double click, avoid click handler
    if (!clickMark) {
      clickMark = true;
    } else {
      clickMark = false;
      return;
    }
    // eslint-disable-next-line func-names
    setTimeout(function() {
      clickMark = false;
    }, 500);

    const contextMenuElement = rootElement.querySelector(
      '#piling-js-context-menu'
    );
    if (contextMenuElement) rootElement.removeChild(contextMenuElement);

    getRelativeMousePosition(event);

    // click event: only when mouse down pos and mouse up pos are the same
    if (
      mousePosition[0] === mouseDownPosition[0] &&
      mousePosition[1] === mouseDownPosition[1]
    ) {
      const results = searchIndex.search({
        minX: mousePosition[0],
        minY: mousePosition[1],
        maxX: mousePosition[0] + 1,
        maxY: mousePosition[1] + 1
      });

      if (results.length !== 0) {
        if (event.shiftKey) {
          const { depileMethod } = store.getState();
          if (depileMethod === 'originalPos') {
            depileToOriginPos(results[0].pileId);
          } else if (depileMethod === 'cloestPos') {
            store.dispatch(createAction.setDepiledPile([results[0].pileId]));
          }
          store.dispatch(createAction.setFocusedPiles([]));
        } else if (event.altKey) {
          results.forEach(result => {
            const pile = pileInstances.get(result.pileId);
            if (pile.graphics.isHover) pile.animateScale();
          });
        } else {
          results.forEach(result => {
            const pile = pileInstances.get(result.pileId);
            if (pile.graphics.isHover) {
              store.dispatch(createAction.setFocusedPiles([result.pileId]));
            }
          });
        }
      } else {
        store.dispatch(createAction.setFocusedPiles([]));
        store.dispatch(createAction.setScaledPile([]));
      }
    }
  };

  const mouseMoveHandler = event => {
    mousePosition = getRelativeMousePosition(event);

    lassoExtendDb();
  };

  const mouseDblClickHandler = event => {
    getRelativeMousePosition(event);

    const { temporaryDepiledPiles, piles } = store.getState();

    const result = searchIndex.search({
      minX: mouseDownPosition[0],
      minY: mouseDownPosition[1],
      maxX: mouseDownPosition[0] + 1,
      maxY: mouseDownPosition[1] + 1
    });

    if (result.length !== 0) {
      if (!store.getState().temporaryDepiledPiles.length) {
        if (piles[result[0].pileId].items.length > 1) {
          let temp = [...temporaryDepiledPiles];
          if (temp.includes(result[0].pileId)) {
            temp = temp.filter(id => id !== result[0].pileId);
          } else {
            temp = [result[0].pileId];
          }
          store.dispatch(createAction.setTemporaryDepiledPiles([...temp]));
        }
      } else {
        store.dispatch(createAction.setTemporaryDepiledPiles([]));
        store.dispatch(createAction.setFocusedPiles([]));
      }
    } else {
      store.dispatch(createAction.setTemporaryDepiledPiles([]));
      store.dispatch(createAction.setFocusedPiles([]));
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
      if (event.altKey) {
        event.preventDefault();
        store.dispatch(createAction.setScaledPile([result[0].pileId]));
        const normalizedDeltaY = normalizeWheel(event).pixelY;
        scalePile(result[0].pileId, normalizedDeltaY);
        const graphics = pileInstances.get(result[0].pileId).graphics;
        activePile.addChild(graphics);
      }
    }
  };

  const mouseScrollHandler = () => {
    stage.y = -rootElement.scrollTop;
    renderRaf();
  };

  const resizeHandler = () => {
    const oldColWidth = layout.colWidth;
    const oldRowHeight = layout.rowHeight;

    const { width, height } = rootElement.getBoundingClientRect();

    layout.colWidth = width / layout.colNum;
    layout.rowHeight = layout.colWidth * layout.cellRatio;

    renderer.resize(width, height);

    scaleItems();

    const movingPiles = [];

    pileInstances.forEach(pile => {
      pile.moveTo(
        (pile.x / oldColWidth) * layout.colWidth,
        (pile.y / oldRowHeight) * layout.rowHeight
      );
      movingPiles.push({
        id: pile.id,
        x: pile.x,
        y: pile.y
      });
    });
    store.dispatch(createAction.movePiles(movingPiles));

    mask
      .beginFill(0xffffff)
      .drawRect(0, 0, width, height)
      .endFill();

    const { orderer } = store.getState();

    renderedItems.forEach(item => {
      const getPosition = orderer(layout.colNum);
      let [x, y] = getPosition(item.id);
      x *= layout.colWidth;
      y *= layout.rowHeight;
      item.originalPosition = [x, y];
    });

    createRBush();
    updateScrollContainer();
    renderRaf();
  };

  const alignByGrid = () => {
    const pileMovements = layout.align(pileInstances);

    pileMovements.forEach(({ id, x, y }, index) => {
      const pile = pileInstances.get(id);
      const tweener = createTweener({
        duration: 250,
        delay: 0,
        interpolator: interpolateVector,
        endValue: [x, y],
        getter: () => {
          return [pile.x, pile.y];
        },
        setter: xy => {
          pile.moveTo(...xy);
        },
        onDone: () => {
          if (index === pileMovements.length - 1) {
            store.dispatch(createAction.movePiles(pileMovements));
            createRBush();
            updateScrollContainer();
            renderRaf();
          }
        }
      });
      animator.add(tweener);
    });
  };

  const closeContextMenu = () => {
    const contextMenuElement = rootElement.querySelector(
      '#piling-js-context-menu'
    );
    if (contextMenuElement) rootElement.removeChild(contextMenuElement);
  };

  const alignByGridClickHandler = () => {
    alignByGrid();
    closeContextMenu();
  };

  const contextmenuHandler = event => {
    closeContextMenu();

    getRelativeMousePosition(event);

    if (!event.altKey) {
      event.preventDefault();

      const results = searchIndex.search({
        minX: mousePosition[0],
        minY: mousePosition[1],
        maxX: mousePosition[0] + 1,
        maxY: mousePosition[1] + 1
      });

      const clickedOnPile = results.length > 0;

      const pileContextMenuItems = clickedOnPile
        ? store
            .getState()
            .pileContextMenuItems.filter(item => item.label && item.callback)
        : [];

      const element = createContextMenu({
        customItems: pileContextMenuItems
      });
      rootElement.appendChild(element);

      const depileBtn = element.querySelector('#depile-button');
      const tempDepileBtn = element.querySelector('#temp-depile-button');
      const gridBtn = element.querySelector('#grid-button');
      const alignBtn = element.querySelector('#align-button');
      const scaleBtn = element.querySelector('#scale-button');

      // click on pile
      if (clickedOnPile) {
        gridBtn.style.display = 'none';
        alignBtn.style.display = 'none';

        let pile;
        results.forEach(result => {
          if (pileInstances.get(result.pileId).graphics.isHover) {
            pile = pileInstances.get(result.pileId);
          }
        });
        if (pile && pile.itemContainer.children.length === 1) {
          depileBtn.setAttribute('disabled', '');
          depileBtn.setAttribute('class', 'inactive');
          tempDepileBtn.setAttribute('disabled', '');
          tempDepileBtn.setAttribute('class', 'inactive');
        } else if (pile.isTempDepiled) {
          depileBtn.setAttribute('disabled', '');
          depileBtn.setAttribute('class', 'inactive');
          scaleBtn.setAttribute('disabled', '');
          scaleBtn.setAttribute('class', 'inactive');
          tempDepileBtn.innerHTML = 'close temp depile';
        }

        if (pile.graphics.scale.x > 1.1) {
          scaleBtn.innerHTML = 'scale down';
        }

        element.style.display = 'block';
        element.style.left = `${mousePosition[0]}px`;
        element.style.top = `${mousePosition[1]}px`;

        depileBtn.addEventListener(
          'click',
          depileBtnClick(element, pile.id),
          false
        );
        tempDepileBtn.addEventListener(
          'click',
          tempDepileBtnClick(element, pile.id, event),
          false
        );
        scaleBtn.addEventListener(
          'click',
          scaleBtnBtnClick(element, pile.id),
          false
        );

        pileContextMenuItems.forEach((item, index) => {
          const button = item.id
            ? element.querySelector(`#${item.id}`)
            : element.querySelector(
                `#piling-js-context-menu-custom-item-${index}`
              );
          button.addEventListener('click', () => {
            item.callback({
              id: pile.id,
              ...store.getState().piles[pile.id]
            });
            if (!item.keepOpen) closeContextMenu();
          });
        });
      } else {
        depileBtn.style.display = 'none';
        tempDepileBtn.style.display = 'none';
        scaleBtn.style.display = 'none';

        if (isGridShown) {
          gridBtn.innerHTML = 'hide grid';
        }
        element.style.display = 'block';
        element.style.left = `${mousePosition[0]}px`;
        element.style.top = `${mousePosition[1]}px`;

        gridBtn.addEventListener('click', gridBtnClick(element), false);
        alignBtn.addEventListener('click', alignByGridClickHandler, false);
      }
    }
  };

  const handleAnimate = tweener => {
    tweener.setEasing(store.getState().easing);
    animator.add(tweener);
  };

  const handleCancelAnimation = tweener => {
    animator.cancel(tweener);
  };

  const handleUpdateBBox = pileId => {
    updateBoundingBox(pileId);
  };

  let storeUnsubscribor;

  const init = () => {
    // Setup event handler
    window.addEventListener('blur', () => {}, false);
    window.addEventListener('mousedown', mouseDownHandler, false);
    window.addEventListener('mouseup', mouseUpHandler, false);
    window.addEventListener('mousemove', mouseMoveHandler, false);
    window.addEventListener('resize', resizeHandler, false);
    window.addEventListener('orientationchange', resizeHandler, false);

    rootElement.addEventListener('scroll', mouseScrollHandler, false);

    canvas.addEventListener('contextmenu', contextmenuHandler, false);
    canvas.addEventListener('mouseenter', () => {}, false);
    canvas.addEventListener('mouseleave', () => {}, false);
    canvas.addEventListener('click', mouseClickHandler, false);
    canvas.addEventListener('dblclick', mouseDblClickHandler, false);
    canvas.addEventListener('wheel', mouseWheelHandler, false);

    pubSub.subscribe('pileDrag', handleDragPile);
    pubSub.subscribe('pileDrop', handleDropPile);
    pubSub.subscribe('animate', handleAnimate);
    pubSub.subscribe('cancelAnimation', handleCancelAnimation);
    pubSub.subscribe('updateBBox', handleUpdateBBox);

    storeUnsubscribor = store.subscribe(updated);
    rootElement.appendChild(canvas);
    rootElement.appendChild(scrollContainer);

    rootElement.style.overflowX = 'hidden';
    rootElement.style.overflowY = 'auto';
    canvas.style.position = 'sticky';
    canvas.style.display = 'block';
    canvas.style.top = '0px';
    canvas.style.left = '0px';

    const { width, height } = canvas.getBoundingClientRect();

    mask
      .beginFill(0xffffff)
      .drawRect(0, 0, width, height)
      .endFill();

    setPublic(initOptions);
  };

  const destroy = () => {
    // Remove event listeners
    window.removeEventListener('keyup', () => {}, false);
    window.removeEventListener('blur', () => {}, false);
    window.removeEventListener('mousedown', mouseDownHandler, false);
    window.removeEventListener('mouseup', mouseUpHandler, false);
    window.removeEventListener('mousemove', mouseMoveHandler, false);
    window.removeEventListener('resize', resizeHandler, false);
    window.removeEventListener('orientationchange', resizeHandler, false);

    rootElement.removeEventListener('scroll', mouseScrollHandler, false);

    canvas.removeEventListener('contextmenu', contextmenuHandler, false);
    canvas.removeEventListener('mouseenter', () => {}, false);
    canvas.removeEventListener('mouseleave', () => {}, false);
    canvas.removeEventListener('click', mouseClickHandler, false);
    canvas.removeEventListener('dblclick', mouseDblClickHandler, false);
    canvas.removeEventListener('wheel', mouseWheelHandler, false);

    renderer.destroy(true);

    if (storeUnsubscribor) {
      storeUnsubscribor();
      storeUnsubscribor = undefined;
    }

    rootElement.removeChild(scrollContainer);

    pubSub.clear();
  };

  init();

  return {
    destroy,
    exportState,
    get,
    importState,
    render: renderRaf,
    set: setPublic,
    subscribe: pubSub.subscribe,
    unsubscribe: pubSub.unsubscribe
  };
};

export default createPilingJs;
