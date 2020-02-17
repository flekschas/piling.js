import { camelToConst, deepClone, cubicInOut, update } from '@flekschas/utils';
import deepEqual from 'deep-equal';
import { createStore as createReduxStore, combineReducers } from 'redux';
import { enableBatching } from 'redux-batched-actions';

import createOrderer from './orderer';

import {
  DEFAULT_DARK_MODE,
  DEFAULT_LASSO_FILL_COLOR,
  DEFAULT_LASSO_FILL_OPACITY,
  DEFAULT_LASSO_SHOW_START_INDICATOR,
  DEFAULT_LASSO_START_INDICATOR_OPACITY,
  DEFAULT_LASSO_STROKE_COLOR,
  DEFAULT_LASSO_STROKE_OPACITY,
  DEFAULT_LASSO_STROKE_SIZE,
  DEFAULT_PILE_ITEM_BRIGHTNESS,
  DEFAULT_PILE_ITEM_TINT,
  DEFAULT_POPUP_BACKGROUND_OPACITY,
  DEFAULT_PREVIEW_BACKGROUND_COLOR,
  DEFAULT_PREVIEW_BACKGROUND_OPACITY,
  NAVIGATION_MODE_AUTO,
  NAVIGATION_MODES
} from './defaults';

const clone = (value, state) => {
  switch (typeof value) {
    case 'object': {
      if (!deepEqual(value, state)) {
        return deepClone(value);
      }

      return state;
    }
    default:
      return value;
  }
};

const setReducer = (key, defaultValue = null) => {
  const actionType = `SET_${camelToConst(key)}`;
  return (state = defaultValue, action) => {
    switch (action.type) {
      case actionType:
        return clone(action.payload[key], state);
      default:
        return state;
    }
  };
};

const setOptionsReducer = (key, options, defaultValue = null) => {
  // eslint-disable-next-line no-param-reassign
  options = new Set(options);

  const actionType = `SET_${camelToConst(key)}`;

  return (state = defaultValue, action) => {
    switch (action.type) {
      case actionType:
        if (options.has(action.payload[key])) {
          return clone(action.payload[key], state);
        }
        return state;

      default:
        return state;
    }
  };
};

const setAction = key => {
  const type = `SET_${camelToConst(key)}`;
  return newValue => ({ type, payload: { [key]: newValue } });
};

const setter = (key, defaultValue = null) => [
  setReducer(key, defaultValue),
  setAction(key)
];

const setterOptions = (key, options, defaultValue = null) => [
  setOptionsReducer(key, options, defaultValue),
  setAction(key)
];

export const reset = () => ({
  type: 'RESET',
  payload: {}
});

export const overwrite = newState => ({
  type: 'OVERWRITE',
  payload: { newState }
});

export const softOverwrite = newState => ({
  type: 'SOFT_OVERWRITE',
  payload: { newState }
});

const [arrangementType, setArrangementType] = setter('arrangementType');

const [arrangementObjective, setArrangementObjective] = setter(
  'arrangementObjective'
);

const [arrangementOnce, setArrangementOnce] = setter('arrangementOnce', false);

const [arrangementOptions, setArrangementOptions] = setter(
  'arrangementOptions',
  {}
);

const [backgroundColor, setBackgroundColor] = setter(
  'backgroundColor',
  0x000000
);

const [darkMode, setDarkMode] = setter('darkMode', DEFAULT_DARK_MODE);

const [dimensionalityReducer, setDimensionalityReducer] = setter(
  'dimensionalityReducer'
);

const [gridColor, setGridColor] = setter('gridColor', 0x787878);

const [gridOpacity, setGridOpacity] = setter('gridOpacity', 1);

const [showGrid, setShowGrid] = setter('showGrid', false);

const [popupBackgroundOpacity, setPopupBackgroundOpacity] = setter(
  'popupBackgroundOpacity',
  DEFAULT_POPUP_BACKGROUND_OPACITY
);

const [lassoFillColor, setLassoFillColor] = setter(
  'lassoFillColor',
  DEFAULT_LASSO_FILL_COLOR
);

const [lassoFillOpacity, setLassoFillOpacity] = setter(
  'lassoFillOpacity',
  DEFAULT_LASSO_FILL_OPACITY
);

const [lassoShowStartIndicator, setLassoShowStartIndicator] = setter(
  'lassoShowStartIndicator',
  DEFAULT_LASSO_SHOW_START_INDICATOR
);

const [lassoStartIndicatorOpacity, setLassoStartIndicatorOpacity] = setter(
  'lassoStartIndicatorOpacity',
  DEFAULT_LASSO_START_INDICATOR_OPACITY
);

const [lassoStrokeColor, setLassoStrokeColor] = setter(
  'lassoStrokeColor',
  DEFAULT_LASSO_STROKE_COLOR
);

const [lassoStrokeOpacity, setLassoStrokeOpacity] = setter(
  'lassoStrokeOpacity',
  DEFAULT_LASSO_STROKE_OPACITY
);

const [lassoStrokeSize, setLassoStrokeSize] = setter(
  'lassoStrokeSize',
  DEFAULT_LASSO_STROKE_SIZE
);

const [itemRenderer, setItemRenderer] = setter('itemRenderer');

const [pileItemOpacity, setPileItemOpacity] = setter('pileItemOpacity', 1.0);

const [previewRenderer, setPreviewRenderer] = setter('previewRenderer');

const [aggregateRenderer, setAggregateRenderer] = setter('aggregateRenderer');

const [previewAggregator, setPreviewAggregator] = setter('previewAggregator');

const [coverAggregator, setCoverAggregator] = setter('coverAggregator');

const [items, setItems] = setter('items', []);

const [orderer, setOrderer] = setter('orderer', createOrderer().rowMajor);

// Grid
const [itemSize, setItemSize] = setter('itemSize');
const [itemSizeRange, setItemSizeRange] = setter('itemSizeRange', [0.5, 1.0]);
const [columns, setColumns] = setter('columns', 10);
const [rowHeight, setRowHeight] = setter('rowHeight');
const [cellAspectRatio, setCellAspectRatio] = setter('cellAspectRatio', 1);
const [cellPadding, setCellPadding] = setter('cellPadding', 12);

const [pileItemAlignment, setPileItemAlignment] = setter('pileItemAlignment', [
  'bottom',
  'right'
]);

const [pileItemBrightness, setPileItemBrightness] = setter(
  'pileItemBrightness',
  DEFAULT_PILE_ITEM_BRIGHTNESS
);

const [pileItemRotation, setPileItemRotation] = setter(
  'pileItemRotation',
  false
);

const [pileItemTint, setPileItemTint] = setter(
  'pileItemTint',
  DEFAULT_PILE_ITEM_TINT
);

const [focusedPiles, setFocusedPiles] = setter('focusedPiles', []);

const [magnifiedPiles, setMagnifiedPiles] = setter('magnifiedPiles', []);

// 'originalPos' and 'closestPos'
const [depileMethod, setDepileMethod] = setter('depileMethod', 'originalPos');

const [depiledPile, setDepiledPile] = setter('depiledPile', []);

const [temporaryDepiledPiles, setTemporaryDepiledPiles] = setter(
  'temporaryDepiledPiles',
  []
);

// 'horizontal' or 'vertical'
const [tempDepileDirection, setTempDepileDirection] = setter(
  'tempDepileDirection',
  'horizontal'
);

const [tempDepileOneDNum, setTempDepileOneDNum] = setter(
  'tempDepileOneDNum',
  6
);

const [easing, setEasing] = setter('easing', cubicInOut);

const [navigationMode, setNavigationMode] = setterOptions(
  'navigationMode',
  NAVIGATION_MODES,
  NAVIGATION_MODE_AUTO
);

const [previewSpacing, setPreviewSpacing] = setter('previewSpacing', 2);

const [previewBackgroundColor, setPreviewBackgroundColor] = setter(
  'previewBackgroundColor',
  DEFAULT_PREVIEW_BACKGROUND_COLOR
);

const [previewBackgroundOpacity, setPreviewBackgroundOpacity] = setter(
  'previewBackgroundOpacity',
  DEFAULT_PREVIEW_BACKGROUND_OPACITY
);

const [previewBorderColor, setPreviewBorderColor] = setter(
  'previewBorderColor',
  0xffffff
);

const [previewBorderOpacity, setPreviewBorderOpacity] = setter(
  'previewBorderOpacity',
  0.85
);

const [pileBorderColor, setPileBorderColor] = setter(
  'pileBorderColor',
  0x808080
);

const [pileBorderOpacity, setPileBorderOpacity] = setter(
  'pileBorderOpacity',
  1.0
);

const [pileBorderColorHover, setPileBorderColorHover] = setter(
  'pileBorderColorHover',
  0x808080
);

const [pileBorderOpacityHover, setPileBorderOpacityHover] = setter(
  'pileBorderOpacityHover',
  1.0
);

const [pileBorderColorFocus, setPileBorderColorFocus] = setter(
  'pileBorderColorFocus',
  0xeee462
);

const [pileBorderOpacityFocus, setPileBorderOpacityFocus] = setter(
  'pileBorderOpacityFocus',
  1.0
);

const [pileBorderColorActive, setPileBorderColorActive] = setter(
  'pileBorderColorActive',
  0xffa5da
);

const [pileBorderOpacityActive, setPileBorderOpacityActive] = setter(
  'pileBorderOpacityActive',
  1.0
);

const [pileBorderSize, setPileBorderSize] = setter('pileBorderSize', 0);

const [pileBackgroundColor, setPileBackgroundColor] = setter(
  'pileBackgroundColor',
  0x000000
);

const [pileBackgroundOpacity, setPileBackgroundOpacity] = setter(
  'pileBackgroundOpacity',
  0.85
);

// 'topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center'
const [pileCellAlignment, setPileCellAlignment] = setter(
  'pileCellAlignment',
  'topLeft'
);

const [pileContextMenuItems, setPileContextMenuItems] = setter(
  'pileContextMenuItems',
  []
);

const [pileOpacity, setPileOpacity] = setter('pileOpacity', 1.0);

const [pileScale, setPileScale] = setter('pileScale', 1.0);

const [randomOffsetRange, setRandomOffsetRange] = setter('randomOffsetRange', [
  -30,
  30
]);

const [
  randomRotationRange,
  setRandomRotationRange
] = setter('randomRotationRange', [-10, 10]);

// reducer
const piles = (previousState = [], action) => {
  switch (action.type) {
    case 'INIT_PILES': {
      return new Array(action.payload.itemLength).fill().map((x, id) => ({
        items: [id],
        x: null,
        y: null
      }));
    }
    case 'MERGE_PILES': {
      const newState = [...previousState];

      if (action.payload.isDropped) {
        const source = action.payload.pileIds[0];
        const target = action.payload.pileIds[1];

        newState[target] = {
          ...newState[target],
          items: [...newState[target].items]
        };

        newState[target].items.push(...newState[source].items);
        newState[source] = {
          ...newState[source],
          items: [],
          x: null,
          y: null
        };
      } else {
        const target = Math.min(...action.payload.pileIds);
        const sourcePileIds = action.payload.pileIds.filter(
          id => id !== target
        );

        let centerX = 0;
        let centerY = 0;
        action.payload.pileIds.forEach(id => {
          centerX += newState[id].x;
          centerY += newState[id].y;
        });
        centerX /= action.payload.pileIds.length;
        centerY /= action.payload.pileIds.length;

        newState[target] = {
          ...newState[target],
          items: [...newState[target].items],
          x: centerX,
          y: centerY
        };

        sourcePileIds.forEach(id => {
          newState[target].items.push(...newState[id].items);
          newState[id] = {
            ...newState[id],
            items: [],
            x: null,
            y: null
          };
        });
      }
      return newState;
    }
    case 'MOVE_PILES': {
      const newState = [...previousState];
      action.payload.movingPiles.forEach(({ id, x, y }) => {
        newState[id] = {
          ...newState[id],
          x,
          y
        };
      });
      return newState;
    }
    case 'DEPILE_PILES': {
      const depilePiles = action.payload.piles.filter(
        pile => pile.items.length > 1
      );

      if (!depilePiles.length) return previousState;

      const newState = [...previousState];

      depilePiles.forEach(pile => {
        pile.items.forEach(itemId => {
          newState[itemId] = {
            ...newState[itemId],
            items: [itemId],
            x: pile.x,
            y: pile.y
          };
        });
      });
      return newState;
    }
    default:
      return previousState;
  }
};

// action
const initPiles = itemLength => ({
  type: 'INIT_PILES',
  payload: { itemLength }
});

const mergePiles = (pileIds, isDropped) => ({
  type: 'MERGE_PILES',
  payload: { pileIds, isDropped }
});

const movePiles = movingPiles => ({
  type: 'MOVE_PILES',
  payload: { movingPiles }
});

const depilePiles = depiledPiles => ({
  type: 'DEPILE_PILES',
  payload: { piles: depiledPiles }
});

const createStore = () => {
  let lastAction = null;

  const appReducer = combineReducers({
    aggregateRenderer,
    arrangementObjective,
    arrangementOnce,
    arrangementOptions,
    arrangementType,
    backgroundColor,
    cellAspectRatio,
    cellPadding,
    columns,
    coverAggregator,
    depiledPile,
    depileMethod,
    dimensionalityReducer,
    easing,
    focusedPiles,
    gridColor,
    gridOpacity,
    darkMode,
    popupBackgroundOpacity,
    itemRenderer,
    items,
    itemSize,
    itemSizeRange,
    lassoFillColor,
    lassoFillOpacity,
    lassoShowStartIndicator,
    lassoStartIndicatorOpacity,
    lassoStrokeColor,
    lassoStrokeOpacity,
    lassoStrokeSize,
    magnifiedPiles,
    navigationMode,
    orderer,
    pileBackgroundColor,
    pileBackgroundOpacity,
    pileBorderColor,
    pileBorderColorActive,
    pileBorderColorFocus,
    pileBorderColorHover,
    pileBorderOpacity,
    pileBorderOpacityActive,
    pileBorderOpacityFocus,
    pileBorderOpacityHover,
    pileBorderSize,
    pileCellAlignment,
    pileContextMenuItems,
    pileItemAlignment,
    pileItemBrightness,
    pileItemOpacity,
    pileItemRotation,
    pileItemTint,
    pileOpacity,
    piles,
    pileScale,
    previewAggregator,
    previewBackgroundColor,
    previewBackgroundOpacity,
    previewBorderColor,
    previewBorderOpacity,
    previewRenderer,
    previewSpacing,
    randomOffsetRange,
    randomRotationRange,
    rowHeight,
    showGrid,
    tempDepileDirection,
    tempDepileOneDNum,
    temporaryDepiledPiles
  });

  const rootReducer = (state, action) => {
    lastAction = action;

    if (action.type === 'RESET') {
      state = undefined; // eslint-disable-line no-param-reassign
    } else if (action.type === 'OVERWRITE') {
      state = action.payload.newState; // eslint-disable-line no-param-reassign
    } else if (action.type === 'SOFT_OVERWRITE') {
      // eslint-disable-next-line no-param-reassign
      state = update(state, action.payload.newState, true);
    }

    return appReducer(state, action);
  };

  const reduxStore = createReduxStore(enableBatching(rootReducer));

  reduxStore.lastAction = () => lastAction;

  Object.defineProperty(reduxStore, 'lastAction', {
    get: () => lastAction
  });

  return reduxStore;
};

export default createStore;

export const createAction = {
  depilePiles,
  initPiles,
  mergePiles,
  movePiles,
  setAggregateRenderer,
  setArrangementObjective,
  setArrangementOnce,
  setArrangementOptions,
  setArrangementType,
  setBackgroundColor,
  setCellAspectRatio,
  setCellPadding,
  setColumns,
  setCoverAggregator,
  setDepiledPile,
  setDepileMethod,
  setDimensionalityReducer,
  setEasing,
  setFocusedPiles,
  setGridColor,
  setGridOpacity,
  setDarkMode,
  setPopupBackgroundOpacity,
  setItemRenderer,
  setItems,
  setItemSize,
  setItemSizeRange,
  setLassoFillColor,
  setLassoFillOpacity,
  setLassoShowStartIndicator,
  setLassoStartIndicatorOpacity,
  setLassoStrokeColor,
  setLassoStrokeOpacity,
  setLassoStrokeSize,
  setMagnifiedPiles,
  setNavigationMode,
  setOrderer,
  setPileBackgroundColor,
  setPileBackgroundOpacity,
  setPileBorderColor,
  setPileBorderColorActive,
  setPileBorderColorFocus,
  setPileBorderColorHover,
  setPileBorderOpacity,
  setPileBorderOpacityActive,
  setPileBorderOpacityFocus,
  setPileBorderOpacityHover,
  setPileBorderSize,
  setPileCellAlignment,
  setPileContextMenuItems,
  setPileItemAlignment,
  setPileItemBrightness,
  setPileItemOpacity,
  setPileItemRotation,
  setPileItemTint,
  setPileOpacity,
  setPileScale,
  setPreviewAggregator,
  setPreviewBackgroundColor,
  setPreviewBackgroundOpacity,
  setPreviewBorderColor,
  setPreviewBorderOpacity,
  setPreviewRenderer,
  setPreviewSpacing,
  setRandomOffsetRange,
  setRandomRotationRange,
  setRowHeight,
  setShowGrid,
  setTempDepileDirection,
  setTempDepileOneDNum,
  setTemporaryDepiledPiles
};
