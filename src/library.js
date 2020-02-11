import * as PIXI from 'pixi.js';
import createDom2dCamera from 'dom-2d-camera';
import { mat4, vec4 } from 'gl-matrix';
import createPubSub from 'pub-sub-es';
import withRaf from 'with-raf';
import * as RBush from 'rbush';
import normalizeWheel from 'normalize-wheel';
import { batchActions } from 'redux-batched-actions';
import {
  capitalize,
  debounce,
  deepClone,
  identity,
  isFunction,
  isPointInPolygon,
  interpolateVector,
  interpolateNumber,
  l2PointDist,
  max,
  mean,
  min,
  range,
  sortPos,
  sum
} from '@flekschas/utils';

import createAnimator from './animator';

import createStore, { overwrite, softOverwrite, createAction } from './store';

import {
  CAMERA_VIEW,
  EVENT_LISTENER_ACTIVE,
  EVENT_LISTENER_PASSIVE,
  INITIAL_ARRANGEMENT_TYPE,
  INITIAL_ARRANGEMENT_OBJECTIVE,
  NAVIGATION_MODE_AUTO,
  NAVIGATION_MODE_PAN_ZOOM,
  NAVIGATION_MODE_SCROLL,
  POSITION_PILES_DEBOUNCE_TIME
} from './defaults';

import {
  cloneSprite,
  colorToDecAlpha,
  getBBox,
  scaleLinear,
  toHomogeneous
} from './utils';

import createImage from './image';
import createImageWithBackground from './image-with-background';
import createPile from './pile';
import createGrid from './grid';
import createItem from './item';
import createTweener from './tweener';
import createContextMenu from './context-menu';
import createLasso from './lasso';

import { version } from '../package.json';

// We cannot import the following libraries using the normal `import` statement
// as this blows up the Rollup bundle massively for some reasons...
const convolve = require('ndarray-convolve');
const ndarray = require('ndarray');

const EXTRA_ROWS = 3;

const createPilingJs = (rootElement, initOptions = {}) => {
  const scrollContainer = document.createElement('div');
  const canvas = document.createElement('canvas');

  const pubSub = createPubSub();
  const store = createStore();

  let state = store.getState();

  let gridMat;

  let translatePointToScreen;
  let translatePointFromScreen;
  let camera;
  const scratch = new Float32Array(16);
  const lastPilePosition = new Map();

  const renderer = new PIXI.Renderer({
    width: rootElement.getBoundingClientRect().width,
    height: rootElement.getBoundingClientRect().height,
    view: canvas,
    antialias: true,
    transparent: true,
    resolution: window.devicePixelRatio,
    autoDensity: true
  });

  let isInitialPositioning = true;
  let isPanZoom = null;
  let isPanZoomed = false;

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
    arrangementObjective: true,
    arrangementType: true,
    backgroundColor: true,
    darkMode: true,
    focusedPiles: true,
    depiledPile: true,
    depileMethod: true,
    easing: true,
    coverAggregator: true,
    items: {
      set: value => [
        createAction.setItems(value),
        createAction.initPiles(value.length)
      ]
    },
    itemSize: true,
    itemSizeRange: true,
    columns: true,
    rowHeight: true,
    cellAspectRatio: true,
    cellPadding: true,
    pileItemAlignment: true,
    pileItemBrightness: true,
    pileItemOpacity: true,
    pileItemRotation: true,
    pileItemTint: true,
    gridColor: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setGridColor(color)];
        if (opacity !== null)
          actions.push(createAction.setGridOpacity(opacity));
        return actions;
      }
    },
    gridOpacity: true,
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
    lassoShowStartIndicator: true,
    lassoStartIndicatorOpacity: true,
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
    magnifiedPiles: true,
    navigationMode: true,
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
    pileBorderColorHover: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setPileBorderColorHover(color)];
        if (opacity !== null)
          actions.push(createAction.setPileBorderOpacityHover(opacity));
        return actions;
      }
    },
    pileBorderOpacityHover: true,
    pileBorderColorFocus: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setPileBorderColorFocus(color)];
        if (opacity !== null)
          actions.push(createAction.setPileBorderOpacityFocus(opacity));
        return actions;
      }
    },
    pileBorderOpacityFocus: true,
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
    pileBorderSize: true,
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
    pileCellAlignment: true,
    pileContextMenuItems: true,
    pileOpacity: true,
    pileScale: true,
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
    previewBorderColor: {
      set: value => {
        const [color, opacity] = colorToDecAlpha(value, null);
        const actions = [createAction.setPreviewBorderColor(color)];
        if (opacity !== null)
          actions.push(createAction.setPreviewBorderOpacity(opacity));
        return actions;
      }
    },
    previewBorderOpacity: true,
    randomOffsetRange: true,
    randomRotationRange: true,
    renderer: {
      get: 'itemRenderer',
      set: value => [createAction.setItemRenderer(value)]
    },
    showGrid: true,
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

  let isMouseDown = false;
  let isLasso = false;

  const lasso = createLasso({
    onStart: () => {
      isLasso = true;
      isMouseDown = true;
    },
    onDraw: () => {
      renderRaf();
    }
  });

  stage.addChild(gridGfx);
  stage.addChild(lasso.fillContainer);
  stage.addChild(normalPiles);
  stage.addChild(activePile);
  stage.addChild(lasso.lineContainer);

  const searchIndex = new RBush();

  const createRBush = () => {
    searchIndex.clear();

    const boxList = [];

    if (pileInstances) {
      pileInstances.forEach(pile => {
        pile.updateBounds();
        boxList.push(pile.bBox);
      });
      searchIndex.load(boxList);
    }
  };

  const deleteSearchIndex = pileId => {
    const pile = pileInstances.get(pileId);

    searchIndex.remove(pile.bBox, (a, b) => {
      return a.id === b.id;
    });
  };

  const updatePileBounds = pileId => {
    const pile = pileInstances.get(pileId);

    searchIndex.remove(pile.bBox, (a, b) => a.id === b.id);
    pile.updateBounds();
    searchIndex.insert(pile.bBox);
  };

  const translatePiles = () => {
    lastPilePosition.forEach((pilePos, pileId) => {
      movePileTo(pileInstances.get(pileId), pilePos[0], pilePos[1]);
    });
    renderRaf();
  };

  const panZoomHandler = (updatePilePosition = true) => {
    // Update the camera
    camera.tick();
    translatePiles();
    isPanZoomed = true;
    if (updatePilePosition) positionPilesDb();
  };

  const panZoomEndHandler = () => {
    if (!isPanZoomed) return;
    isPanZoomed = false;
    // Update the camera
    camera.tick();
    translatePiles();
    positionPiles();
  };

  let layout;

  const updateScrollContainer = () => {
    const canvasHeight = canvas.getBoundingClientRect().height;
    const finalHeight =
      Math.round(layout.rowHeight) * (layout.numRows + EXTRA_ROWS);
    scrollContainer.style.height = `${Math.max(
      0,
      finalHeight - canvasHeight
    )}px`;
  };

  const enableScrolling = () => {
    if (isPanZoom === false) return;

    disablePanZoom();

    isPanZoom = false;
    translatePointToScreen = identity;
    translatePointFromScreen = identity;

    stage.y = 0;
    rootElement.style.overflowY = 'auto';
    rootElement.scrollTop = 0;
    rootElement.addEventListener(
      'scroll',
      mouseScrollHandler,
      EVENT_LISTENER_PASSIVE
    );
    window.addEventListener(
      'mousedown',
      mouseDownHandler,
      EVENT_LISTENER_PASSIVE
    );
    window.addEventListener('mouseup', mouseUpHandler, EVENT_LISTENER_PASSIVE);
    window.addEventListener(
      'mousemove',
      mouseMoveHandler,
      EVENT_LISTENER_PASSIVE
    );
    canvas.addEventListener('wheel', wheelHandler, EVENT_LISTENER_ACTIVE);
  };

  const disableScrolling = () => {
    if (isPanZoom !== false) return;

    stage.y = 0;
    rootElement.style.overflowY = 'hidden';
    rootElement.scrollTop = 0;
    rootElement.removeEventListener('scroll', mouseScrollHandler);
    window.removeEventListener('mousedown', mouseDownHandler);
    window.removeEventListener('mouseup', mouseUpHandler);
    window.removeEventListener('mousemove', mouseMoveHandler);
    canvas.removeEventListener('wheel', wheelHandler);
  };

  const enablePanZoom = () => {
    if (isPanZoom === true) return;

    disableScrolling();

    isPanZoom = true;
    translatePointToScreen = translatePointToCamera;
    translatePointFromScreen = translatePointFromCamera;

    camera = createDom2dCamera(canvas, {
      isNdc: false,
      onMouseDown: mouseDownHandler,
      onMouseUp: mouseUpHandler,
      onMouseMove: mouseMoveHandler,
      onWheel: wheelHandler
    });
    camera.set(mat4.clone(CAMERA_VIEW));
  };

  const disablePanZoom = () => {
    if (isPanZoom !== true) return;

    camera.dispose();
    camera = undefined;
  };

  const drawGrid = () => {
    const height =
      scrollContainer.getBoundingClientRect().height +
      canvas.getBoundingClientRect().height;
    const { width } = canvas.getBoundingClientRect();

    const vLineNum = Math.ceil(width / layout.columnWidth);
    const hLineNum = Math.ceil(height / layout.rowHeight);

    const { gridColor, gridOpacity } = store.getState();

    gridGfx.clear();
    gridGfx.lineStyle(1, gridColor, gridOpacity);
    // vertical lines
    for (let i = 1; i < vLineNum; i++) {
      gridGfx.moveTo(i * layout.columnWidth, 0);
      gridGfx.lineTo(i * layout.columnWidth, height);
    }
    // horizontal lines
    for (let i = 1; i < hLineNum; i++) {
      gridGfx.moveTo(0, i * layout.rowHeight);
      gridGfx.lineTo(width, i * layout.rowHeight);
    }
  };

  const clearGrid = () => {
    gridGfx.clear();
  };

  const initGrid = () => {
    const {
      cellAspectRatio,
      cellPadding,
      columns,
      itemSize,
      orderer,
      pileCellAlignment,
      rowHeight
    } = store.getState();

    layout = createGrid(canvas, {
      cellAspectRatio,
      cellPadding,
      columns,
      itemSize,
      orderer,
      pileCellAlignment,
      rowHeight
    });

    updateScrollContainer();
  };

  const updateGrid = () => {
    const oldLayout = layout;

    const {
      cellAspectRatio,
      cellPadding,
      columns,
      itemSize,
      orderer,
      pileCellAlignment,
      rowHeight,
      showGrid
    } = store.getState();

    layout = createGrid(canvas, {
      itemSize,
      columns,
      rowHeight,
      cellAspectRatio,
      orderer,
      pileCellAlignment,
      cellPadding
    });

    // eslint-disable-next-line no-use-before-define
    updateLayout(oldLayout, layout);
    updateScrollContainer();

    if (showGrid) {
      drawGrid();
    }
  };

  const updateLasso = () => {
    const {
      darkMode,
      lassoFillColor,
      lassoFillOpacity,
      lassoShowStartIndicator,
      lassoStartIndicatorOpacity,
      lassoStrokeColor,
      lassoStrokeOpacity,
      lassoStrokeSize
    } = store.getState();

    lasso.set({
      fillColor: lassoFillColor,
      fillOpacity: lassoFillOpacity,
      showStartIndicator: lassoShowStartIndicator,
      startIndicatorOpacity: lassoStartIndicatorOpacity,
      strokeColor: lassoStrokeColor,
      strokeOpacity: lassoStrokeOpacity,
      strokeSize: lassoStrokeSize,
      darkMode
    });
  };

  let itemSizeScale = scaleLinear();

  const scaleItems = () => {
    if (!renderedItems.size) return;

    let minSize = Infinity;
    let maxSize = 0;

    renderedItems.forEach(item => {
      const size = Math.max(
        item.image.displayObject.width,
        item.image.displayObject.height
      );
      if (size > maxSize) maxSize = size;
      if (size < minSize) minSize = size;
    });

    const { itemSizeRange } = store.getState();
    let scaleRange;

    const minRange = Math.min(layout.cellWidth, layout.cellHeight);

    // if it's within [0, 1] assume it's relative
    if (
      itemSizeRange[0] > 0 &&
      itemSizeRange[0] <= 1 &&
      itemSizeRange[1] > 0 &&
      itemSizeRange[1] <= 1
    ) {
      scaleRange = [minRange * itemSizeRange[0], minRange * itemSizeRange[1]];
    }
    // else assume absolute values in pixels
    else {
      scaleRange = itemSizeRange;
    }

    itemSizeScale = scaleLinear()
      .domain([minSize, maxSize])
      .range(scaleRange);

    renderedItems.forEach(item => {
      const scaleFactor = itemSizeScale(item.image.size) / item.image.size;
      item.image.sprite.width *= scaleFactor;
      item.image.sprite.height *= scaleFactor;

      if (item.preview) {
        item.preview.sprite.width *= scaleFactor;
        item.preview.sprite.height *= scaleFactor;
        item.preview.drawBackground();
      }
    });

    pileInstances.forEach(pile => pile.updateCover());
  };

  const movePileTo = (pile, x, y) => {
    pile.moveTo(...translatePointToScreen([x, y]));
  };

  const movePileToWithUpdate = (pile, x, y) => {
    movePileTo(pile, x, y);
    updatePileBounds(pile.id);
  };

  const animateMovePileTo = (pile, x, y, options) => {
    pile.animateMoveTo(...translatePointToScreen([x, y]), options);
  };

  const updateLayout = oldLayout => {
    const { arrangementType } = store.getState();

    scaleItems();

    if (arrangementType === null) {
      // Since there is no automatic arrangement in place we manually move
      // piles from their old cell position to their new cell position
      const movingPiles = [];

      layout.numRows = Math.ceil(renderedItems.size / layout.numColumns);
      pileInstances.forEach(pile => {
        const oldRowNum = Math.floor(pile.bBox.cY / oldLayout.rowHeight);
        const oldColumnNum = Math.floor(pile.bBox.cX / oldLayout.columnWidth);

        const cellIndex = Math.round(
          oldRowNum * oldLayout.numColumns + oldColumnNum
        );

        const [x, y] = layout.idxToXy(
          cellIndex,
          pile.graphics.width,
          pile.graphics.height
        );

        movingPiles.push({ id: pile.id, x, y });
      });

      pileInstances.forEach(pile => {
        if (pile.cover()) {
          const { pileItemAlignment, pileItemRotation } = store.getState();

          pile.positionItems(
            pileItemAlignment,
            pileItemRotation,
            animator,
            store.getState().previewSpacing
          );
        }
      });

      store.dispatch(createAction.movePiles(movingPiles));

      renderedItems.forEach(item => {
        item.setOriginalPosition(
          layout.idxToXy(
            item.id,
            item.image.displayObject.width,
            item.image.displayObject.height
          )
        );
      });
    } else {
      positionPiles();
    }

    createRBush();

    store.getState().focusedPiles.forEach(focusedPile => {
      pileInstances.get(focusedPile).focus();
    });

    updateScrollContainer();
    renderRaf();
  };

  const createItems = () => {
    const {
      items,
      itemRenderer,
      previewBackgroundColor,
      previewBackgroundOpacity,
      pileItemAlignment,
      pileItemRotation,
      previewAggregator,
      previewRenderer,
      previewSpacing
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

    normalPiles.removeChildren();
    activePile.removeChildren();

    const renderImages = itemRenderer(
      items.map(({ src }) => src)
    ).then(textures => textures.map(createImage));

    const previewOptions = {
      backgroundColor: previewBackgroundColor,
      backgroundOpacity: previewBackgroundOpacity,
      padding: previewSpacing
    };
    const createPreview = texture =>
      createImageWithBackground(texture, previewOptions);

    const renderPreviews = previewAggregator
      ? previewAggregator(items.map(({ src }) => src))
          .then(previewRenderer)
          .then(textures => textures.map(createPreview))
      : Promise.resolve([]);

    return Promise.all([renderImages, renderPreviews]).then(
      ([renderedImages, renderedPreviews]) => {
        renderedImages.forEach((image, index) => {
          const { piles } = store.getState();
          const id = items[index].id || index;
          const preview = renderedPreviews[index];

          const newItem = createItem({ id, image, pubSub }, { preview });

          renderedItems.set(id, newItem);

          const pile = createPile({
            items: [newItem],
            render: renderRaf,
            id: index,
            pubSub,
            store
          });
          pile.positionItems(
            pileItemAlignment,
            pileItemRotation,
            animator,
            previewSpacing
          );
          pileInstances.set(index, pile);
          updatePileStyle(piles[index], index);
          updatePileItemStyle(piles[index], index);
          normalPiles.addChild(pile.graphics);
        });
        scaleItems();
        renderRaf();
      }
    );
  };

  const getPilePositionByData = (pileId, pileWidth, pileHeight, pileState) => {
    const { arrangementObjective } = store.getState();

    switch (arrangementObjective.length) {
      case 0:
        console.warn(
          "Can't arrange pile by data. No arrangement objective available."
        );
        return [pileState.x, pileState.y];

      case 1:
        return layout.idxToXy(
          pileSortPosByAggregate[0][pileId],
          pileWidth,
          pileHeight
        );

      case 2:
        return arrangement2dScales.map((scale, i) =>
          scale(aggregatedPileValues[i][pileId])
        );

      default:
        return arrangement2dScales.map((scale, i) =>
          scale(aggregatedPileValues[i][pileId])
        );
    }
  };

  const getPilePosition = (pileId, init) => {
    const { arrangementType, arrangementObjective, piles } = store.getState();

    const type = init
      ? arrangementType || INITIAL_ARRANGEMENT_TYPE
      : arrangementType;

    const objective = init
      ? arrangementObjective || INITIAL_ARRANGEMENT_OBJECTIVE
      : arrangementObjective;

    const pileInstance = pileInstances.get(pileId);
    const pileState = piles[pileId];
    const pileWidth = pileInstance.graphics.width;
    const pileHeight = pileInstance.graphics.height;

    const ijToXy = (i, j) => layout.ijToXy(i, j, pileWidth, pileHeight);

    switch (type) {
      case 'data':
        return getPilePositionByData(pileId, pileWidth, pileHeight, pileState);

      case 'index':
        return ijToXy(...layout.idxToIj(objective(pileState, pileId)));

      case 'ij':
        return ijToXy(...objective(pileState, pileId));

      case 'xy':
        return objective(pileState, pileId);

      case 'uv':
        return layout.uvToXy(...objective(pileState, pileId));

      default:
        return [pileState.x, pileState.y];
    }
  };

  const translatePointToCamera = ([x, y]) => {
    const v = toHomogeneous(x, y);

    vec4.transformMat4(v, v, camera.view);

    return v.slice(0, 2);
  };

  const translatePointFromCamera = ([x, y]) => {
    const v = toHomogeneous(x, y);

    vec4.transformMat4(v, v, mat4.invert(scratch, camera.view));

    return v.slice(0, 2);
  };

  const positionPiles = (pileIds = [], { immideate = false } = {}) => {
    const { items } = store.getState();

    if (!pileIds.length) {
      const { piles } = store.getState();
      pileIds.splice(0, pileIds.length - 1, ...range(0, piles.length));
    }

    if (items.length === 0) return;

    const movingPiles = [];

    const readyPiles = pileIds
      .filter(id => pileInstances.has(id))
      .map(id => pileInstances.get(id));

    if (readyPiles.length) {
      readyPiles.forEach(pile => {
        const point = getPilePosition(pile.id, isInitialPositioning);
        lastPilePosition.set(pile.id, point);

        const [x, y] = point;

        if (immideate) movePileToWithUpdate(pile, x, y);

        movingPiles.push({ id: pile.id, x, y });

        layout.numRows = Math.max(
          layout.numRows,
          Math.ceil(y / layout.rowHeight)
        );

        if (isInitialPositioning) {
          renderedItems.get(pile.id).setOriginalPosition([x, y]);
        }
      });

      isInitialPositioning = false;
    }

    store.dispatch(createAction.movePiles(movingPiles));

    createRBush();
    updateScrollContainer();
    renderRaf();
  };

  const positionPilesDb = debounce(positionPiles, POSITION_PILES_DEBOUNCE_TIME);

  const positionItems = pileId => {
    const { pileItemAlignment, pileItemRotation } = store.getState();

    pileInstances
      .get(pileId)
      .positionItems(
        pileItemAlignment,
        pileItemRotation,
        animator,
        store.getState().previewSpacing
      );
  };

  const updatePileItemStyle = (pileState, pileId) => {
    const {
      items,
      pileItemBrightness,
      pileItemOpacity,
      pileItemTint
    } = store.getState();

    const pileInstance = pileInstances.get(pileId);

    pileInstance.items.forEach((pileItem, i) => {
      const itemState = items[pileItem.id];

      pileItem.animateOpacity(
        isFunction(pileItemOpacity)
          ? pileItemOpacity(itemState, i, pileState)
          : pileItemOpacity
      );

      pileItem.image.brightness(
        isFunction(pileItemBrightness)
          ? pileItemBrightness(itemState, i, pileState)
          : pileItemBrightness
      );

      // We can't apply a brightness and tint effect as both rely on the same
      // mechanism. Therefore we decide to give brightness higher precedence.
      if (!pileItemBrightness) {
        pileItem.image.tint(
          isFunction(pileItemTint)
            ? pileItemTint(itemState, i, pileState)
            : pileItemTint
        );
      }
    });
  };

  const updatePileStyle = (pile, pileId) => {
    const pileInstance = pileInstances.get(pileId);

    if (!pileInstance) return;

    const { pileOpacity, pileBorderSize, pileScale } = store.getState();

    pileInstance.opacity(
      isFunction(pileOpacity) ? pileOpacity(pile) : pileOpacity
    );

    pileInstance.animateScale(
      isFunction(pileScale) ? pileScale(pile) : pileScale
    );

    pileInstance.borderSize(
      isFunction(pileBorderSize) ? pileBorderSize(pile) : pileBorderSize
    );
  };

  const createScaledImage = texture => {
    const image = createImage(texture);
    const scaleFactor = itemSizeScale(image.size) / image.size;
    image.sprite.width *= scaleFactor;
    image.sprite.height *= scaleFactor;
    return image;
  };

  const updatePreviewAndCover = (pileState, pileInstance) => {
    const { items, aggregateRenderer, coverAggregator } = store.getState();

    if (pileState.items.length === 1) {
      pileInstance.cover(null);
      positionItems(pileInstance.id);
      pileInstance.setItems([renderedItems.get(pileState.items[0])]);
    } else {
      const itemSrcs = [];
      const itemInstances = [];
      let width = -Infinity;

      pileState.items.forEach(itemId => {
        const itemInstance = renderedItems.get(itemId);

        itemSrcs.push(items[itemId].src);

        width = Math.max(width, itemInstance.image.width);

        itemInstances.push(itemInstance);
      });

      pileInstance.setItems(itemInstances, { asPreview: true });

      const coverImage = coverAggregator(itemSrcs)
        .then(aggregatedSrcs => aggregateRenderer([aggregatedSrcs]))
        .then(([coverTexture]) => createScaledImage(coverTexture));

      pileInstance.cover(coverImage);

      coverImage.then(() => {
        positionItems(pileInstance.id);
      });

      //   coverAggregator(itemSrcs)
      //     .then(aggregatedSrcs => aggregateRenderer([aggregatedSrcs]))
      //     .then(([coverTexture]) => {
      //       const cover = new PIXI.Sprite(coverTexture);
      //       cover.anchor.set(0.5);
      //       const aspectRatio = cover.width / cover.height;
      //       cover.width = width;
      //       cover.height = cover.width / aspectRatio;

      //       positionItems(pileInstance.id);

      //       return cover;
      //     })
      // );
    }
  };

  const updatePileItems = (pileState, id) => {
    if (pileInstances.has(id)) {
      const pileInstance = pileInstances.get(id);
      if (pileState.items.length === 0) {
        deleteSearchIndex(id);
        pileInstance.destroy();
        pileInstances.delete(id);
        lastPilePosition.delete(id);
      } else {
        if (store.getState().previewAggregator) {
          updatePreviewAndCover(pileState, pileInstance);
        } else {
          const itemInstances = pileState.items.map(itemId =>
            renderedItems.get(itemId)
          );
          pileInstance.setItems(itemInstances);
          positionItems(id);
        }
        updatePileBounds(id);
        updatePileItemStyle(pileState, id);
      }
    } else {
      const [x, y] = translatePointToScreen([pileState.x, pileState.y]);
      const newPile = createPile(
        {
          items: [renderedItems.get(id)],
          render: renderRaf,
          id,
          pubSub,
          store
        },
        { x, y }
      );
      pileInstances.set(id, newPile);
      normalPiles.addChild(newPile.graphics);
      updatePileBounds(id);
      updatePileItemStyle(pileState, id);
      lastPilePosition.set(id, [pileState.x, pileState.y]);
    }
  };

  const updatePilePosition = (pileState, id) => {
    const pileInstance = pileInstances.get(id);
    if (pileInstance) {
      lastPilePosition.set(id, [pileState.x, pileState.y]);
      animateMovePileTo(pileInstance, pileState.x, pileState.y);
    }
  };

  const updateGridMat = pileId => {
    const mat = ndarray(
      new Uint16Array(new Array(layout.numColumns * layout.numRows).fill(0)),
      [layout.numRows, layout.olNum]
    );

    gridMat = mat;

    pileInstances.forEach(pile => {
      if (pile.id === pileId) return;

      const minY = Math.floor(pile.bBox.minX / layout.columnWidth);
      const minX = Math.floor(pile.bBox.minY / layout.rowHeight);
      const maxY = Math.floor(pile.bBox.maxX / layout.columnWidth);
      const maxX = Math.floor(pile.bBox.maxY / layout.rowHeight);

      gridMat.set(minX, minY, 1);
      gridMat.set(minX, maxY, 1);
      gridMat.set(maxX, minY, 1);
      gridMat.set(maxX, maxY, 1);
    });
  };

  const next = (distanceMat, current) => {
    let nextPos;
    let minValue = Infinity;

    // top
    if (
      current[0] - 1 >= 0 &&
      distanceMat.get(current[0] - 1, current[1]) < minValue
    ) {
      minValue = distanceMat.get(current[0] - 1, current[1]);
      nextPos = [current[0] - 1, current[1]];
    }

    // left
    if (
      current[1] - 1 >= 0 &&
      distanceMat.get(current[0], current[1] - 1) < minValue
    ) {
      minValue = distanceMat.get(current[0], current[1] - 1);
      nextPos = [current[0], current[1] - 1];
    }

    // bottom
    if (
      current[0] + 1 < distanceMat.shape[0] &&
      distanceMat.get(current[0] + 1, current[1]) < minValue
    ) {
      minValue = distanceMat.get(current[0] + 1, current[1]);
      nextPos = [current[0] + 1, current[1]];
    }

    // right
    if (
      current[1] + 1 < distanceMat.shape[1] &&
      distanceMat.get(current[0], current[1] + 1) < minValue
    ) {
      minValue = distanceMat.get(current[0], current[1] + 1);
      nextPos = [current[0], current[1] + 1];
    }

    const length = distanceMat.data.length;
    distanceMat.set(current[0], current[1], length);

    if (minValue === distanceMat.data.length) {
      for (let i = 0; i < distanceMat.shape[0]; i++) {
        for (let j = 0; j < distanceMat.shape[1]; j++) {
          if (distanceMat.get(i, j) < minValue && distanceMat.get(i, j) > 0)
            minValue = distanceMat.get(i, j);
          nextPos = [i, j];
        }
      }
    }

    return nextPos;
  };

  const calcDist = (distanceMat, x, y, origin) => {
    if (distanceMat.get(x, y) !== -1) return;

    const distance = l2PointDist(x, y, origin[0], origin[1]);
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
      layout.numRows += filterRowNum;
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
        (layout.numRows - filterRowNum + 1) *
          (layout.numColumns - filterColNum + 1)
      ),
      [layout.numRows - filterRowNum + 1, layout.olNum - filterColNum + 1]
    );

    convolve(resultMat, gridMat, filter);

    return resultMat;
  };

  const findPos = (origin, colNum, rowNum) => {
    const resultMat = convolveGridMat(colNum, rowNum);

    const distanceMat = ndarray(
      new Float32Array(
        new Array(
          (layout.numRows - rowNum + 1) * (layout.numColumns - colNum + 1)
        ).fill(-1)
      ),
      [layout.numRows - rowNum + 1, layout.numColumns - colNum + 1]
    );

    const depilePos = findDepilePos(distanceMat, resultMat, origin, rowNum);
    const distance = l2PointDist(
      depilePos[0],
      depilePos[1],
      origin[0],
      origin[1]
    );

    return { depilePos, distance };
  };

  const animateDepile = (srcPileId, itemIds, itemPositions = []) => {
    const movingPiles = [];

    const srcPile = pileInstances.get(srcPileId);
    srcPile.blur();
    srcPile.drawBorder();

    itemIds.forEach((itemId, index) => {
      const pile = pileInstances.get(itemId);
      const pileItem = pile.getItemById(itemId);
      animator.add(
        createTweener({
          duration: 250,
          delay: 0,
          interpolator: interpolateVector,
          endValue: [
            ...(itemPositions.length > 0
              ? itemPositions[index]
              : translatePointToScreen(pileItem.item.originalPosition)),
            0
          ],
          getter: () => {
            return [pile.x, pile.y, pileItem.displayObject.angle];
          },
          setter: newValue => {
            pile.moveTo(newValue[0], newValue[1]);
            pileItem.displayObject.angle = newValue[2];
          },
          onDone: () => {
            movingPiles.push({
              id: pile.id,
              x: pileItem.item.originalPosition[0],
              y: pileItem.item.originalPosition[1]
            });
            updatePileBounds(pile.id);
            // when animation is done, dispatch move piles
            if (index === itemIds.length - 1) {
              store.dispatch(createAction.movePiles(movingPiles));
            }
          }
        })
      );
    });
  };

  const depile = pileId => {
    const itemNum = pileInstances.get(pileId).size;

    if (itemNum === 1) return;

    updateGridMat(pileId);

    // take the center point of pile as the original pos
    const bBox = pileInstances.get(pileId).bBox;
    const centerY = Math.floor(
      (bBox.minX + bBox.maxX) / (layout.columnWidth * 2)
    );
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
      itemPositions.push([y * layout.columnWidth, x * layout.rowHeight]);
    }
    // starts from the depiled pile's position
    const depiledPile = {
      items,
      x: piles[pileId].x,
      y: piles[pileId].y
    };
    depiledPiles.push(depiledPile);
    store.dispatch(createAction.depilePiles(depiledPiles));
    animateDepile(pileId, items, itemPositions);
    store.dispatch(createAction.setDepiledPile([]));
  };

  const depileToOriginPos = pileId => {
    const { piles } = store.getState();

    const items = [...piles[pileId].items];

    // starts from the depiled pile's position
    const depiledPile = {
      items,
      x: piles[pileId].x,
      y: piles[pileId].y
    };

    store.dispatch(createAction.depilePiles([depiledPile]));
    blurPrevHoveredPiles();

    if (!store.getState().arrangementType) {
      animateDepile(pileId, items);
    }
  };

  const animateTempDepileItems = (item, x, y, { onDone = identity } = {}) => {
    const tweener = createTweener({
      interpolator: interpolateVector,
      endValue: [x, y],
      getter: () => {
        return [item.x, item.y];
      },
      setter: newValue => {
        item.x = newValue[0];
        item.y = newValue[1];
      },
      onDone: () => {
        onDone();
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

  const closeTempDepile = pileIds => {
    pileIds.forEach(pileId => {
      const pile = pileInstances.get(pileId);

      const onDone = () => {
        pile.tempDepileContainer.removeChildren();
        pile.isTempDepiled = false;
        pile.hover();
        store.dispatch(createAction.setFocusedPiles([]));
        updatePileBounds(pileId);
      };

      pile.tempDepileContainer.children.forEach((item, index) => {
        const options =
          index === pile.tempDepileContainer.children.length - 1
            ? { onDone }
            : undefined;

        animateTempDepileItems(
          item,
          -pile.tempDepileContainer.x,
          -pile.tempDepileContainer.y,
          options
        );
      });

      pubSub.publish('pileInactive', { pile });
    });
    renderRaf();
  };

  const tempDepileOneD = ({ pile, tempDepileDirection, items }) => {
    const onDone = () => {
      pile.isTempDepiled = true;
      store.dispatch(createAction.setFocusedPiles([]));
      store.dispatch(createAction.setFocusedPiles([pile.id]));
    };
    const createOptions = isLast => (isLast ? { onDone } : undefined);

    if (tempDepileDirection === 'horizontal') {
      pile.tempDepileContainer.x = pile.bBox.maxX - pile.bBox.minX + 10;
      pile.tempDepileContainer.y = 0;
      pile.tempDepileContainer.interactive = true;

      let widths = 0;
      items.forEach((itemId, index) => {
        const clonedSprite = cloneSprite(
          renderedItems.get(itemId).image.sprite
        );
        clonedSprite.x = -pile.tempDepileContainer.x;
        pile.tempDepileContainer.addChild(clonedSprite);

        const options = createOptions(index === items.length - 1);

        animateTempDepileItems(clonedSprite, index * 5 + widths, 0, options);

        widths += clonedSprite.width;
      });
    } else if (tempDepileDirection === 'vertical') {
      pile.tempDepileContainer.x = 0;
      pile.tempDepileContainer.y = pile.bBox.maxY - pile.bBox.minY + 10;
      pile.tempDepileContainer.interactive = true;

      let heights = 0;
      items.forEach((itemId, index) => {
        const clonedSprite = cloneSprite(
          renderedItems.get(itemId).image.sprite
        );
        clonedSprite.y = -pile.tempDepileContainer.y;
        pile.tempDepileContainer.addChild(clonedSprite);

        const options = createOptions(index === items.length - 1);

        animateTempDepileItems(clonedSprite, 0, index * 5 + heights, options);

        heights += clonedSprite.height;
      });
    }
  };

  const tempDepileTwoD = ({ pile, items, orderer }) => {
    pile.tempDepileContainer.x = pile.bBox.maxX - pile.bBox.minX + 10;
    pile.tempDepileContainer.y = 0;

    const squareLength = Math.ceil(Math.sqrt(items.length));

    const onDone = () => {
      pile.isTempDepiled = true;
      store.dispatch(createAction.setFocusedPiles([]));
      store.dispatch(createAction.setFocusedPiles([pile.id]));
    };

    const createOptions = isLast => (isLast ? { onDone } : undefined);

    items.forEach((itemId, index) => {
      const clonedSprite = cloneSprite(renderedItems.get(itemId).image.sprite);
      clonedSprite.x = -pile.tempDepileContainer.x;
      pile.tempDepileContainer.addChild(clonedSprite);
      const getPosition = orderer(squareLength);
      let [x, y] = getPosition(index);
      x *= layout.columnWidth;
      y *= layout.rowHeight;

      const options = createOptions(index === items.length - 1);

      animateTempDepileItems(clonedSprite, x, y, options);
    });
  };

  const tempDepile = pileIds => {
    const {
      piles,
      tempDepileDirection,
      tempDepileOneDNum,
      orderer
    } = store.getState();

    pileIds.forEach(pileId => {
      const pile = pileInstances.get(pileId);

      animateAlpha(pile.graphics, 1);
      pile.graphics.interactive = true;

      const items = [...piles[pileId].items];

      if (items.length < tempDepileOneDNum) {
        tempDepileOneD({
          pile,
          tempDepileDirection,
          items
        });
      } else {
        tempDepileTwoD({ pile, items, orderer });
      }
      pubSub.publish('pileActive', { pile });

      updatePileBounds(pileId);
    });
    renderRaf();
  };

  let mousePosition = [0, 0];

  const getRelativeMousePosition = event => {
    const rect = canvas.getBoundingClientRect();

    mousePosition[0] = event.clientX - rect.left;
    mousePosition[1] = event.clientY - rect.top - stage.y;

    return [...mousePosition];
  };

  const findPilesInLasso = lassoPolygon => {
    const lassoBBox = getBBox(lassoPolygon);
    const pileBBoxes = searchIndex.search(lassoBBox);
    const pilesInPolygon = [];
    pileBBoxes.forEach(pileBBox => {
      if (
        isPointInPolygon([pileBBox.minX, pileBBox.minY], lassoPolygon) ||
        isPointInPolygon([pileBBox.minX, pileBBox.maxY], lassoPolygon) ||
        isPointInPolygon([pileBBox.maxX, pileBBox.minY], lassoPolygon) ||
        isPointInPolygon([pileBBox.maxX, pileBBox.maxY], lassoPolygon)
      )
        pilesInPolygon.push(pileBBox.id);
    });

    return pilesInPolygon;
  };

  const lassoEndHandler = () => {
    isLasso = false;
    const lassoPosFlat = lasso.end();
    const pilesInLasso = findPilesInLasso(lassoPosFlat);
    if (pilesInLasso.length > 1) {
      store.dispatch(createAction.setFocusedPiles([]));
      animateMerge(pilesInLasso);
    }
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
      const onDone =
        index === pileIds.length - 1
          ? () => {
              updatePileBounds(pile.id);
              store.dispatch(createAction.mergePiles(pileIds, false));
            }
          : identity;

      animateMovePileTo(pile, centerX, centerY, { onDone });
    });
  };

  const scalePile = (pileId, wheelDelta) => {
    const pile = pileInstances.get(pileId);
    if (pile.magnifyByWheel(wheelDelta)) {
      updatePileBounds(pileId);
    }
    renderRaf();
  };

  const updateNavigationMode = () => {
    const {
      arrangementType,
      arrangementObjective,
      navigationMode
    } = store.getState();

    switch (navigationMode) {
      case NAVIGATION_MODE_PAN_ZOOM:
        enablePanZoom();
        break;

      case NAVIGATION_MODE_SCROLL:
        enableScrolling();
        break;

      case NAVIGATION_MODE_AUTO:
      default:
        switch (arrangementType) {
          case 'data':
            if (arrangementObjective.length > 1) enablePanZoom();
            else enableScrolling();
            break;

          case 'xy':
          case 'uv':
            enablePanZoom();
            break;

          case 'index':
          case 'ij':
            enableScrolling();
            break;

          default:
          // Nothing
        }
        break;
    }

    translatePiles();
    positionPiles();
    updateScrollContainer();
  };

  const aggregatedPileValues = [];
  const pileSortPosByAggregate = [];
  const aggregatedPileMinValues = [];
  const aggregatedPileMaxValues = [];

  const updateAggregatedPileValues = pileIds => {
    const { arrangementObjective, items, piles } = store.getState();

    const allPiles = pileIds.length >= pileInstances.size;

    arrangementObjective.forEach((objective, i) => {
      let minValue =
        typeof aggregatedPileMinValues[i] === 'undefined' || allPiles
          ? Infinity
          : aggregatedPileMinValues[i];

      let maxValue =
        typeof aggregatedPileMaxValues[i] === 'undefined' || allPiles
          ? -Infinity
          : aggregatedPileMaxValues[i];

      // When all piles were updated we need to update the min-max value as well
      let shouldUpdateMinMax = allPiles;

      const aggregatedValues = aggregatedPileValues[i] || [];

      // Even if not all piles were updated we might still need to update the
      // min-max values. This is the when the user piled-up piles with the
      // lowest or highest aggregated value
      if (!allPiles && pileSortPosByAggregate[i]) {
        let minPos = 0;
        let maxPos = pileInstances.size;
        let newMin = false;
        let newMax = false;

        pileIds.forEach(id => {
          const pos = pileSortPosByAggregate[i][id];

          // If the pile that updated was positioned at the current lowest
          // position we're going to increase the lowest position and indicate
          // that we need to get a new min value
          if (pos === minPos) {
            minPos++;
            newMin = true;
            shouldUpdateMinMax = true;
          }

          // Equivalent to how we update the min position
          if (pos === maxPos) {
            maxPos--;
            newMax = true;
            shouldUpdateMinMax = true;
          }

          return pileSortPosByAggregate[i][id];
        });

        minValue = newMin
          ? aggregatedValues[pileSortPosByAggregate[i].indexOf(minPos)]
          : minValue;

        maxValue = newMax
          ? aggregatedValues[pileSortPosByAggregate[i].indexOf(maxPos)]
          : maxValue;
      }

      pileIds.forEach(pileId => {
        const pileValues = piles[pileId].items.map((itemId, index) =>
          objective.property(items[itemId], itemId, index)
        );

        const aggregatedValue = objective.aggregator(pileValues);

        if (aggregatedValue < minValue) {
          minValue = aggregatedValue;
          shouldUpdateMinMax = true;
        }

        if (aggregatedValue > maxValue) {
          maxValue = aggregatedValue;
          shouldUpdateMinMax = true;
        }

        aggregatedValues[pileId] = Number.isNaN(aggregatedValue)
          ? // This will ensure that the value is ignored during the sort process
            null
          : aggregatedValue;
      });

      // Remove outdated values
      aggregatedValues.splice(items.length);

      aggregatedPileValues[i] = aggregatedValues;
      pileSortPosByAggregate[i] = sortPos(aggregatedValues, {
        ignoreNull: true
      });

      if (shouldUpdateMinMax) {
        aggregatedPileMinValues[i] = minValue;
        aggregatedPileMaxValues[i] = maxValue;
      }
    });

    // Remove outdated values
    aggregatedPileValues.splice(arrangementObjective.length);
    pileSortPosByAggregate.splice(arrangementObjective.length);
    aggregatedPileMinValues.splice(arrangementObjective.length);
    aggregatedPileMaxValues.splice(arrangementObjective.length);
  };

  const updateArrangement1dOrderer = pileIds => {
    updateAggregatedPileValues(pileIds);
  };

  let arrangement2dScales = [];
  const updateArrangement2dScales = pileIds => {
    const { arrangementObjective } = store.getState();
    const { width, height } = canvas.getBoundingClientRect();
    const rangeMax = [width, height];

    updateAggregatedPileValues(pileIds);

    arrangement2dScales = arrangementObjective.map((objective, i) => {
      const currentScale = arrangement2dScales[i];
      const minValue = aggregatedPileMinValues[i];
      const maxValue = aggregatedPileMaxValues[i];

      if (currentScale) {
        const [currentMin, currentMax] = currentScale.domain();

        if (minValue === currentMin && maxValue === currentMax) {
          return arrangement2dScales[i];
        }
      }

      const domain = objective.inverted
        ? [maxValue, minValue]
        : [minValue, maxValue];

      const meanItemSize = mean(
        itemSizeScale.domain().map(size => itemSizeScale(size))
      );

      return objective
        .scale()
        .domain(domain)
        .range([meanItemSize / 2, rangeMax[i] - meanItemSize / 2]);
    });
  };

  const updateArragnementByData = pileIds => {
    const { arrangementObjective } = store.getState();

    switch (arrangementObjective.length) {
      case 0:
        console.warn('No arrangement objectives found!');
        break;

      case 1:
        updateArrangement1dOrderer(pileIds);
        break;

      case 2:
        updateArrangement2dScales(pileIds);
        break;

      default:
        console.warn(
          'Multi-dimensional arrangement is not yet available. Will fallback to a 2D scatter plot of the first 2 objectives.'
        );
        break;
    }
  };

  const updateArrangement = updatedPileIds => {
    const { arrangementType, items } = store.getState();

    const pileIds = updatedPileIds.length
      ? updatedPileIds
      : range(0, items.length);

    if (arrangementType === 'data') {
      updateArragnementByData(pileIds);
    }

    updateNavigationMode();
  };

  const updated = () => {
    const newState = store.getState();

    const stateUpdates = new Set();

    const updatedItems = [];
    const updatedPileItems = [];

    if (
      state.items !== newState.items ||
      state.itemRenderer !== newState.itemRenderer ||
      state.previewRenderer !== newState.previewRenderer ||
      state.aggregateRenderer !== newState.aggregateRenderer ||
      state.previewAggregator !== newState.previewAggregator ||
      state.coverAggregator !== newState.coverAggregator
    ) {
      updatedItems.push(createItems());
    }

    if (state.itemSizeRange !== newState.itemSizeRange) {
      stateUpdates.add('layout');
    }

    if (state.piles !== newState.piles) {
      if (state.piles.length !== 0) {
        newState.piles.forEach((pile, id) => {
          if (pile === state.piles[id]) return;

          if (pile.items.length !== state.piles[id].items.length) {
            updatePileItems(pile, id);
            updatedPileItems.push(id);
          }

          if (
            (pile.x !== state.piles[id].x || pile.y !== state.piles[id].y) &&
            pile.items.length !== 0
          ) {
            updatePilePosition(pile, id);
          }

          updatePileStyle(pile, id);
        });
      }
    }

    if (
      pileInstances.size &&
      (state.pileItemOpacity !== newState.pileItemOpacity ||
        state.pileItemBrightness !== newState.pileItemBrightness ||
        state.pileItemTint !== newState.pileItemTint)
    ) {
      newState.piles.forEach((pile, id) => {
        updatePileItemStyle(pile, id);
      });
    }

    if (
      pileInstances.size &&
      (state.pileOpacity !== newState.pileOpacity ||
        state.pileBorderSize !== newState.pileBorderSize ||
        state.pileScale !== newState.pileScale)
    ) {
      newState.piles.forEach((pile, id) => {
        updatePileStyle(pile, id);
      });
    }

    if (state.orderer !== newState.orderer) {
      stateUpdates.add('layout');
    }

    if (
      state.itemSize !== newState.itemSize ||
      state.columns !== newState.columns ||
      state.rowHeight !== newState.rowHeight ||
      state.cellAspectRatio !== newState.cellAspectRatio ||
      state.cellPadding !== newState.cellPadding ||
      state.orderer !== newState.orderer ||
      state.pileCellAlignment !== newState.pileCellAlignment
    ) {
      stateUpdates.add('grid');
      stateUpdates.add('layout');
    }

    if (state.pileItemAlignment !== newState.pileItemAlignment) {
      stateUpdates.add('layout');
    }

    if (state.pileItemRotation !== newState.pileItemRotation) {
      stateUpdates.add('layout');
    }

    if (state.tempDepileDirection !== newState.tempDepileDirection) {
      stateUpdates.add('layout');
    }

    if (state.tempDepileOneDNum !== newState.tempDepileOneDNum) {
      stateUpdates.add('layout');
    }

    if (state.temporaryDepiledPiles !== newState.temporaryDepiledPiles) {
      if (state.temporaryDepiledPiles.length) {
        closeTempDepile(state.temporaryDepiledPiles);
      }

      if (newState.temporaryDepiledPiles.length) {
        pileInstances.forEach(otherPile => {
          animateAlpha(otherPile.graphics, 0.1);
          otherPile.graphics.interactive = false;
        });

        tempDepile(newState.temporaryDepiledPiles);
      } else {
        pileInstances.forEach(otherPile => {
          animateAlpha(otherPile.graphics, 1);
          otherPile.graphics.interactive = true;
        });
      }
    }

    if (state.focusedPiles !== newState.focusedPiles) {
      // Unset previously focused pile
      if (pileInstances.has(state.focusedPiles[0])) {
        const pile = pileInstances.get(state.focusedPiles[0]);
        if (!pile.isTempDepiled) {
          pile.blur();
          pile.isFocus = false;
        }
      }

      // Set newly focused pile if any
      if (newState.focusedPiles.length !== 0) {
        const pile = pileInstances.get(newState.focusedPiles[0]);
        if (pile.isTempDepiled) {
          pile.active();
        } else {
          pile.focus();
        }
        pile.isFocus = true;
        pubSub.publish('pileFocus', { pile });
      } else {
        const pile = pileInstances.get(state.focusedPiles[0]);
        pubSub.publish('pileBlur', { pile });
      }

      renderRaf();
    }

    if (state.magnifiedPiles !== newState.magnifiedPiles) {
      state.magnifiedPiles
        .map(scaledPile => pileInstances.get(scaledPile))
        .filter(scaledPileInstance => scaledPileInstance)
        .forEach(scaledPileInstance => {
          // We currently allow only one item to be magnified up so all
          // previously magnified piles are reset
          scaledPileInstance.unmagnify();
          updatePileBounds(scaledPileInstance.id);
          activePile.removeChildren();
          normalPiles.addChild(scaledPileInstance.graphics);
        });

      newState.magnifiedPiles
        .map(scaledPile => pileInstances.get(scaledPile))
        .filter(scaledPileInstance => scaledPileInstance)
        .forEach(scaledPileInstance => {
          scaledPileInstance.magnify();
          activePile.addChild(scaledPileInstance.graphics);
        });

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

    if (state.showGrid !== newState.showGrid) {
      if (newState.showGrid) drawGrid();
      else clearGrid();
    }

    // prettier-ignore
    if (
      newState.items.length &&
      (
        state.arrangementType !== newState.arrangementType ||
        state.arrangementObjective !== newState.arrangementObjective ||
        (
          newState.arrangementType &&
          (updatedItems.length || updatedPileItems.length)
        )
      )
    ) {
      stateUpdates.add('layout');
      Promise.all(updatedItems).then(() => {
        updateArrangement(updatedPileItems);
      });
    }

    if (state.navigationMode !== newState.navigationMode) {
      stateUpdates.add('navigation');
    }

    if (
      state.darkMode !== newState.darkMode ||
      state.lassoFillColor !== newState.lassoFillColor ||
      state.lassoFillOpacity !== newState.lassoFillOpacity ||
      state.lassoShowStartIndicator !== newState.lassoShowStartIndicator ||
      state.lassoStartIndicatorOpacity !==
        newState.lassoStartIndicatorOpacity ||
      state.lassoStrokeColor !== newState.lassoStrokeColor ||
      state.lassoStrokeOpacity !== newState.lassoStrokeOpacity ||
      state.lassoStrokeSize !== newState.lassoStrokeSize
    ) {
      updateLasso();
    }

    state = newState;

    pubSub.publish('update', { action: store.lastAction });

    // Consequential updates that cause new actions to be dispatched
    if (stateUpdates.has('grid')) {
      updateGrid();
    }

    if (
      stateUpdates.has('layout') ||
      updatedItems.length > 0 ||
      updatedPileItems.length > 0
    ) {
      Promise.all(updatedItems).then(() => {
        // Reposition of all piles
        positionPiles();
      });
    }

    if (stateUpdates.has('navigation')) {
      updateNavigationMode();
    }
  };

  const resetPileBorder = () => {
    pileInstances.forEach(pile => {
      if (!pile.isFocus) {
        pile.blur();
      }
    });
  };

  const exportState = () => {
    const clonedState = deepClone(state);
    clonedState.version = { version };
    return clonedState;
  };

  const importState = (newState, overwriteState = false) => {
    if (newState.version !== { version }) {
      console.warn(
        `The version of the imported state "${newState.version}" doesn't match the library version "${VERSION}". Use at your own risk!`
      );
    }

    delete newState.version;

    if (overwriteState) store.dispatch(overwrite(newState));
    else store.dispatch(softOverwrite(newState));

    resetPileBorder();
  };

  // eslint-disable-next-line consistent-return
  const expandProperty = objective => {
    if (isFunction(objective)) {
      return objective;
    }
    return itemState => itemState[objective];
  };

  const expandArrangementObjective = arrangementObjective => {
    if (!Array.isArray(arrangementObjective)) {
      // eslint-disable-next-line no-param-reassign
      arrangementObjective = [arrangementObjective];
    }
    const expandedArrangementObjective = [];

    arrangementObjective.forEach(objective => {
      const expandedObjective = {};

      if (objective.constructor !== Object) {
        expandedObjective.property = expandProperty(objective);
        expandedObjective.aggregator = mean;
        expandedObjective.scale = scaleLinear;
        expandedObjective.inverse = false;
      } else {
        expandedObjective.property = expandProperty(objective.property);

        switch (objective.aggregator) {
          case 'max':
            expandedObjective.aggregator = max;
            break;
          case 'min':
            expandedObjective.aggregator = min;
            break;
          case 'sum':
            expandedObjective.aggregator = sum;
            break;
          case 'mean':
          default:
            expandedObjective.aggregator = mean;
            break;
        }

        if (isFunction(objective.scale)) {
          expandedObjective.scale = objective.scale;
        } else {
          switch (objective.scale) {
            case 'linear':
            default:
              expandedObjective.scale = scaleLinear;
              break;
          }
        }

        expandedObjective.inverse = !!objective.inverse;
      }
      expandedArrangementObjective.push(expandedObjective);
    });
    return expandedArrangementObjective;
  };

  const arrangeBy = (type = null, objective = null) => {
    const expandedObjective =
      type === 'data' ? expandArrangementObjective(objective) : objective;

    store.dispatch(
      batchActions([
        ...set('arrangementType', type, true),
        ...set('arrangementObjective', expandedObjective, true)
      ])
    );
  };

  const animateDropMerge = (sourcePileId, targetPileId) => {
    const { piles } = store.getState();
    const x = piles[targetPileId].x;
    const y = piles[targetPileId].y;

    const onDone = () => {
      store.dispatch(
        createAction.mergePiles([sourcePileId, targetPileId], true)
      );
    };

    animateMovePileTo(pileInstances.get(sourcePileId), x, y, { onDone });
  };

  let hit;

  const pileDragEndHandler = ({ pileId }) => {
    hit = false;
    const pile = pileInstances.get(pileId);
    const pileGfx = pile.graphics;

    if (pile.x !== pileGfx.beforeDragX || pile.y !== pileGfx.beforeDragY) {
      const searchBBox = pileInstances.get(pileId).calcBBox();
      const collidePiles = searchIndex
        .search(searchBBox)
        .filter(collidePile => collidePile.id !== pileId);

      // only one pile is colliding with the pile
      if (collidePiles.length === 1) {
        const targetPileId = collidePiles[0].id;
        hit = !pileInstances.get(targetPileId).isTempDepiled;
        if (hit) {
          // TODO: The drop merge animation code should be unified

          // This is needed for the drop merge animation of the pile class
          pile.items.forEach(pileItem => {
            pileItem.item.tmpAbsX = pileGfx.x;
            pileItem.item.tmpAbsY = pileGfx.y;
            pileItem.item.tmpRelScale = pile.scale;
          });

          if (store.getState().previewAggregator) {
            animateDropMerge(pileId, targetPileId);
          } else {
            store.dispatch(
              createAction.mergePiles([pileId, targetPileId], true)
            );
          }
        }
      } else {
        // We need to "untranslate" the position of the pile
        const [x, y] = translatePointFromScreen([pile.x, pile.y]);
        store.dispatch(
          createAction.movePiles([
            {
              id: pileId,
              x,
              y
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

  let previouslyHoveredPiles = [];

  const blurPrevHoveredPiles = () => {
    previouslyHoveredPiles
      .map(pile => pileInstances.get(pile.id))
      .filter(identity)
      .forEach(pile => {
        pile.blur();
      });

    previouslyHoveredPiles = [];
  };

  const highlightHoveringPiles = pileId => {
    if (store.getState().temporaryDepiledPiles.length) return;

    const currentlyHoveredPiles = searchIndex.search(
      pileInstances.get(pileId).calcBBox()
    );

    blurPrevHoveredPiles();

    currentlyHoveredPiles
      .map(pile => pileInstances.get(pile.id))
      .filter(identity)
      .forEach(pile => {
        pile.hover();
      });

    previouslyHoveredPiles = [...currentlyHoveredPiles];
  };

  const pileDragStartHandler = ({ pileId, event }) => {
    const pile = pileInstances.get(pileId);

    if (pile && pile.isMagnified) {
      const mousePos = event.data.getLocalPosition(pile.graphics.parent);

      pile.graphics.draggingMouseOffset[0] /= pile.magnification;
      pile.graphics.draggingMouseOffset[1] /= pile.magnification;
      animateMovePileTo(
        pile,
        mousePos.x - pile.graphics.draggingMouseOffset[0],
        mousePos.y - pile.graphics.draggingMouseOffset[1]
      );
    }

    store.dispatch(createAction.setMagnifiedPiles([]));

    activePile.addChild(pileInstances.get(pileId).graphics);
    highlightHoveringPiles(pileId);
  };

  const pileDragMoveHandler = ({ pileId }) => {
    highlightHoveringPiles(pileId);
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

  const toggleGridBtnClick = contextMenuElement => () => {
    const { showGrid } = store.getState();

    store.dispatch(createAction.setShowGrid(!showGrid));

    hideContextMenu(contextMenuElement);

    renderRaf();
  };

  const pileMagnificationHandler = (contextMenuElement, pileId) => () => {
    const pile = pileInstances.get(pileId);
    if (pile.isMagnified) {
      store.dispatch(createAction.setMagnifiedPiles([]));
    } else {
      store.dispatch(createAction.setMagnifiedPiles([pileId]));
    }

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

      isMouseDown = !result;
    }
  };

  const mouseUpHandler = () => {
    if (isMouseDown) {
      if (isLasso) {
        lassoEndHandler();
      } else if (isPanZoom) {
        panZoomEndHandler();
      }
    }
    isMouseDown = false;
  };

  const mouseMoveHandler = event => {
    mousePosition = getRelativeMousePosition(event);

    if (isMouseDown) {
      if (event.shiftKey || isLasso) {
        lasso.extendDb(mousePosition.slice());
      } else if (isPanZoom) {
        panZoomHandler(false);
      }
    }
  };

  let isClicked = false;

  const mouseClickHandler = event => {
    // when double click, avoid click handler
    if (isClicked) {
      isClicked = false;
      return;
    }

    isClicked = true;

    setTimeout(() => {
      isClicked = false;
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
            depileToOriginPos(results[0].id);
          } else if (depileMethod === 'cloestPos') {
            store.dispatch(createAction.setDepiledPile([results[0].id]));
          }
          store.dispatch(createAction.setFocusedPiles([]));
        } else if (event.altKey) {
          results.forEach(result => {
            const pile = pileInstances.get(result.id);
            if (pile.graphics.isHover) {
              if (pile.isMagnified) {
                store.dispatch(createAction.setMagnifiedPiles([]));
              } else {
                store.dispatch(createAction.setMagnifiedPiles([result.pileId]));
              }
            }
          });
        } else {
          results.forEach(result => {
            const pile = pileInstances.get(result.id);
            if (pile.graphics.isHover) {
              store.dispatch(createAction.setFocusedPiles([result.id]));
            }
          });
        }
      } else {
        lasso.showStartIndicator(mouseDownPosition.slice());
        store.dispatch(createAction.setFocusedPiles([]));
        store.dispatch(createAction.setMagnifiedPiles([]));
      }
    }
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

    if (result.length !== 0 && !temporaryDepiledPiles.length) {
      if (piles[result[0].id].items.length > 1) {
        let temp = [...temporaryDepiledPiles];
        if (temp.includes(result[0].id)) {
          temp = temp.filter(id => id !== result[0].id);
        } else {
          temp = [result[0].id];
        }
        store.dispatch(createAction.setTemporaryDepiledPiles([...temp]));
      }
    } else {
      store.dispatch(createAction.setTemporaryDepiledPiles([]));
      store.dispatch(createAction.setFocusedPiles([]));
    }
  };

  const wheelHandler = event => {
    if (event.altKey) {
      getRelativeMousePosition(event);

      const result = searchIndex.search({
        minX: mousePosition[0],
        minY: mousePosition[1],
        maxX: mousePosition[0] + 1,
        maxY: mousePosition[1] + 1
      });

      if (result.length !== 0) {
        event.preventDefault();
        store.dispatch(createAction.setMagnifiedPiles([result[0].pileId]));
        scalePile(result[0].id, normalizeWheel(event).pixelY);
      }
    } else if (isPanZoom) {
      panZoomHandler();
    }
  };

  const mouseScrollHandler = () => {
    stage.y = -rootElement.scrollTop;
    renderRaf();
  };

  const resizeHandler = () => {
    const { width, height } = rootElement.getBoundingClientRect();

    renderer.resize(width, height);

    mask
      .beginFill(0xffffff)
      .drawRect(0, 0, width, height)
      .endFill();

    updateGrid();
  };

  const resizeHandlerDb = debounce(resizeHandler, 500);

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
          movePileTo(pile, xy[0], xy[1]);
        },
        onDone: () => {
          updatePileBounds(pile.id);
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

    if (event.altKey) return;

    const { pileContextMenuItems, showGrid } = store.getState();

    event.preventDefault();

    const results = searchIndex.search({
      minX: mousePosition[0],
      minY: mousePosition[1],
      maxX: mousePosition[0] + 1,
      maxY: mousePosition[1] + 1
    });

    const clickedOnPile = results.length > 0;

    const element = createContextMenu({
      customItems: pileContextMenuItems.filter(
        item => item.label && item.callback
      )
    });
    rootElement.appendChild(element);

    const depileBtn = element.querySelector('#depile-button');
    const tempDepileBtn = element.querySelector('#temp-depile-button');
    const toggleGridBtn = element.querySelector('#grid-button');
    const alignBtn = element.querySelector('#align-button');
    const magnifyBtn = element.querySelector('#magnify-button');

    // click on pile
    if (clickedOnPile) {
      toggleGridBtn.style.display = 'none';
      alignBtn.style.display = 'none';

      let pile;
      results.forEach(result => {
        if (pileInstances.get(result.id).graphics.isHover) {
          pile = pileInstances.get(result.id);
        }
      });

      if (pile && pile.size === 1) {
        depileBtn.setAttribute('disabled', '');
        depileBtn.setAttribute('class', 'inactive');
        tempDepileBtn.setAttribute('disabled', '');
        tempDepileBtn.setAttribute('class', 'inactive');
      } else if (pile.isTempDepiled) {
        depileBtn.setAttribute('disabled', '');
        depileBtn.setAttribute('class', 'inactive');
        magnifyBtn.setAttribute('disabled', '');
        magnifyBtn.setAttribute('class', 'inactive');
        tempDepileBtn.innerHTML = 'close temp depile';
      }

      if (pile.isMagnified) {
        magnifyBtn.innerHTML = 'Unmagnify';
      }

      element.style.display = 'block';

      const { width } = element.getBoundingClientRect();
      if (mousePosition[0] > canvas.getBoundingClientRect().width - width) {
        element.style.left = `${mousePosition[0] - width}px`;
      } else {
        element.style.left = `${mousePosition[0]}px`;
      }
      element.style.top = `${mousePosition[1]}px`;

      depileBtn.addEventListener(
        'click',
        depileBtnClick(element, pile.id),
        EVENT_LISTENER_PASSIVE
      );
      tempDepileBtn.addEventListener(
        'click',
        tempDepileBtnClick(element, pile.id, event),
        EVENT_LISTENER_PASSIVE
      );
      magnifyBtn.addEventListener(
        'click',
        pileMagnificationHandler(element, pile.id),
        EVENT_LISTENER_PASSIVE
      );

      pileContextMenuItems.forEach((item, index) => {
        const button = item.id
          ? element.querySelector(`#${item.id}`)
          : element.querySelector(
              `#piling-js-context-menu-custom-item-${index}`
            );
        button.addEventListener(
          'click',
          () => {
            item.callback({
              id: pile.id,
              ...store.getState().piles[pile.id]
            });
            if (!item.keepOpen) closeContextMenu();
          },
          {
            once: true,
            passive: true
          }
        );
      });
    } else {
      depileBtn.style.display = 'none';
      tempDepileBtn.style.display = 'none';
      magnifyBtn.style.display = 'none';

      if (showGrid) {
        toggleGridBtn.innerHTML = 'Hide Grid';
      }
      element.style.display = 'block';

      const { width } = element.getBoundingClientRect();
      if (mousePosition[0] > canvas.getBoundingClientRect().width - width) {
        element.style.left = `${mousePosition[0] - width}px`;
      } else {
        element.style.left = `${mousePosition[0]}px`;
      }
      element.style.top = `${mousePosition[1]}px`;

      toggleGridBtn.addEventListener(
        'click',
        toggleGridBtnClick(element),
        EVENT_LISTENER_PASSIVE
      );
      alignBtn.addEventListener(
        'click',
        alignByGridClickHandler,
        EVENT_LISTENER_PASSIVE
      );
    }
  };

  const startAnimationHandler = tweener => {
    tweener.setEasing(store.getState().easing);
    animator.add(tweener);
  };

  const cancelAnimationHandler = tweener => {
    animator.cancel(tweener);
  };

  let storeUnsubscribor;

  const init = () => {
    // Setup event handler
    window.addEventListener('resize', resizeHandlerDb, EVENT_LISTENER_PASSIVE);
    window.addEventListener(
      'orientationchange',
      resizeHandlerDb,
      EVENT_LISTENER_PASSIVE
    );

    canvas.addEventListener(
      'contextmenu',
      contextmenuHandler,
      EVENT_LISTENER_ACTIVE
    );
    canvas.addEventListener('click', mouseClickHandler, EVENT_LISTENER_PASSIVE);
    canvas.addEventListener(
      'dblclick',
      mouseDblClickHandler,
      EVENT_LISTENER_PASSIVE
    );

    pubSub.subscribe('pileDragStart', pileDragStartHandler);
    pubSub.subscribe('pileDragMove', pileDragMoveHandler);
    pubSub.subscribe('pileDragEnd', pileDragEndHandler);
    pubSub.subscribe('startAnimation', startAnimationHandler);
    pubSub.subscribe('cancelAnimation', cancelAnimationHandler);
    pubSub.subscribe('updatePileBounds', updatePileBounds);

    storeUnsubscribor = store.subscribe(updated);
    rootElement.appendChild(canvas);
    rootElement.appendChild(scrollContainer);
    rootElement.appendChild(lasso.startIndicator);

    rootElement.style.overflowX = 'hidden';
    canvas.style.position = 'sticky';
    canvas.style.display = 'block';
    canvas.style.top = '0px';
    canvas.style.left = '0px';

    resizeHandler();
    initGrid();
    enableScrolling();

    setPublic(initOptions);
  };

  const destroy = () => {
    // Remove event listeners
    window.removeEventListener('mousedown', mouseDownHandler);
    window.removeEventListener('mouseup', mouseUpHandler);
    window.removeEventListener('mousemove', mouseMoveHandler);
    window.removeEventListener('resize', resizeHandlerDb);
    window.removeEventListener('orientationchange', resizeHandlerDb);

    rootElement.removeEventListener('scroll', mouseScrollHandler);

    canvas.removeEventListener('contextmenu', contextmenuHandler);
    canvas.removeEventListener('click', mouseClickHandler);
    canvas.removeEventListener('dblclick', mouseDblClickHandler);
    canvas.removeEventListener('wheel', wheelHandler);

    renderer.destroy(true);
    lasso.destroy();

    if (storeUnsubscribor) {
      storeUnsubscribor();
      storeUnsubscribor = undefined;
    }

    rootElement.removeChild(scrollContainer);

    pubSub.clear();
  };

  init();

  return {
    // Properties
    get version() {
      return { version };
    },
    // Methods
    arrangeBy,
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
