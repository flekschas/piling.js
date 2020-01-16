import deepEqual from 'deep-equal';
import { createStore as createReduxStore, combineReducers } from 'redux';
import { enableBatching } from 'redux-batched-actions';

import createOrderer from './orderer';
import { camelToConst, deepClone, cubicInOut, update } from './utils';

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

const setAction = key => {
  const type = `SET_${camelToConst(key)}`;
  return newValue => ({ type, payload: { [key]: newValue } });
};

const setter = (key, defaultValue = null) => [
  setReducer(key, defaultValue),
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

const [backgroundColor, setBackgroundColor] = setter(
  'backgroundColor',
  0x000000
);

const [gridColor, setGridColor] = setter('gridColor', 0x787878);

const [gridOpacity, setGridOpacity] = setter('gridOpacity', 1);

const [showGrid, setShowGrid] = setter('showGrid', false);

const [lassoFillColor, setLassoFillColor] = setter('lassoFillColor', 0xffffff);

const [lassoFillOpacity, setLassoFillOpacity] = setter(
  'lassoFillOpacity',
  0.15
);

const [lassoStrokeColor, setLassoStrokeColor] = setter(
  'lassoStrokeColor',
  0xffffff
);

const [lassoStrokeOpacity, setLassoStrokeOpacity] = setter(
  'lassoStrokeOpacity',
  0.8
);

const [lassoStrokeSize, setLassoStrokeSize] = setter('lassoStrokeSize', 1);

const [itemRenderer, setItemRenderer] = setter('itemRenderer');

const [itemOpacity, setItemOpacity] = setter('itemOpacity', 1.0);

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
const [itemPadding, setItemPadding] = setter('itemPadding', 12);

const [itemAlignment, setItemAlignment] = setter('itemAlignment', [
  'bottom',
  'right'
]);

const [itemRotated, setItemRotated] = setter('itemRotated', false);

const [focusedPiles, setFocusedPiles] = setter('focusedPiles', []);

const [scaledPile, setScaledPile] = setter('scaledPile', []);

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

const [previewSpacing, setPreviewSpacing] = setter('previewSpacing', 2);

const [previewBackgroundColor, setPreviewBackgroundColor] = setter(
  'previewBackgroundColor',
  0xffffff
);

const [previewBackgroundOpacity, setPreviewBackgroundOpacity] = setter(
  'previewBackgroundOpacity',
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
const [pileCellAlign, setPileCellAlign] = setter('pileCellAlign', 'topLeft');

const [pileContextMenuItems, setPileContextMenuItems] = setter(
  'pileContextMenuItems',
  []
);

const [pileOpacity, setPileOpacity] = setter('pileOpacity', 1.0);

const [pileScale, setPileScale] = setter('pileScale', 1.0);

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
    backgroundColor,
    focusedPiles,
    coverAggregator,
    depiledPile,
    depileMethod,
    easing,
    itemSize,
    itemSizeRange,
    columns,
    rowHeight,
    cellAspectRatio,
    gridColor,
    gridOpacity,
    itemPadding,
    itemAlignment,
    itemOpacity,
    itemRenderer,
    itemRotated,
    items,
    lassoFillColor,
    lassoFillOpacity,
    lassoStrokeColor,
    lassoStrokeOpacity,
    lassoStrokeSize,
    orderer,
    pileBorderColor,
    pileBorderOpacity,
    pileBorderColorFocus,
    pileBorderOpacityFocus,
    pileBorderColorActive,
    pileBorderOpacityActive,
    pileBorderSize,
    pileBackgroundColor,
    pileBackgroundOpacity,
    pileCellAlign,
    pileContextMenuItems,
    pileOpacity,
    piles,
    pileScale,
    previewAggregator,
    previewBackgroundColor,
    previewBackgroundOpacity,
    previewRenderer,
    previewSpacing,
    scaledPile,
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
  initPiles,
  mergePiles,
  movePiles,
  depilePiles,
  setBackgroundColor,
  setGridColor,
  setGridOpacity,
  setLassoFillColor,
  setLassoFillOpacity,
  setLassoStrokeColor,
  setLassoStrokeOpacity,
  setLassoStrokeSize,
  setItemRenderer,
  setItemOpacity,
  setPreviewRenderer,
  setAggregateRenderer,
  setPreviewAggregator,
  setCoverAggregator,
  setItems,
  setOrderer,
  setItemSize,
  setItemSizeRange,
  setColumns,
  setRowHeight,
  setCellAspectRatio,
  setItemPadding,
  setItemAlignment,
  setItemRotated,
  setFocusedPiles,
  setScaledPile,
  setShowGrid,
  setDepileMethod,
  setDepiledPile,
  setTemporaryDepiledPiles,
  setTempDepileDirection,
  setTempDepileOneDNum,
  setEasing,
  setPreviewSpacing,
  setPreviewBackgroundColor,
  setPreviewBackgroundOpacity,
  setPileBorderColor,
  setPileBorderOpacity,
  setPileBorderColorFocus,
  setPileBorderOpacityFocus,
  setPileBorderColorActive,
  setPileBorderOpacityActive,
  setPileBorderSize,
  setPileBackgroundColor,
  setPileBackgroundOpacity,
  setPileContextMenuItems,
  setPileOpacity,
  setPileScale,
  setPileCellAlign
};
