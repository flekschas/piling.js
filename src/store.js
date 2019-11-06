import deepEqual from 'deep-equal';
import { createStore as createReduxStore, combineReducers } from 'redux';

import createOrderer from './orderer';
import { camelToConst, deepClone, cubicInOut } from './utils';

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

const [backgroundColor, setBackgroundColor] = setter(
  'backgroundColor',
  0x000000
);

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

const [grid, setGrid] = setter('grid', []);

const [itemSizeRange, setItemSizeRange] = setter('itemSizeRange', [0.7, 0.9]);

const [itemAlignment, setItemAlignment] = setter('itemAlignment', [
  'bottom',
  'right'
]);

const [itemRotated, setItemRotated] = setter('itemRotated', false);

const [clickedPile, setClickedPile] = setter('clickedPile', []);

const [scaledPile, setScaledPile] = setter('scaledPile', []);

// 'originalPos' and 'closestPos'
const [depileMethod, setDepileMethod] = setter('depileMethod', 'originalPos');

const [depiledPile, setDepiledPile] = setter('depiledPile', []);

const [temporaryDepiledPile, setTemporaryDepiledPile] = setter(
  'temporaryDepiledPile',
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

const [pileBorderColorSelected, setPileBorderColorSelected] = setter(
  'pileBorderColorSelected',
  0xeee462
);

const [pileBorderOpacitySelected, setPileBorderOpacitySelected] = setter(
  'pileBorderOpacitySelected',
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

const [pileBackgroundColor, setPileBackgroundColor] = setter(
  'pileBackgroundColor',
  0x000000
);

const [pileBackgroundOpacity, setPileBackgroundOpacity] = setter(
  'pileBackgroundOpacity',
  0.85
);

const [pileContextMenuItems, setPileContextMenuItems] = setter(
  'pileContextMenuItems',
  []
);

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
  const appReducer = combineReducers({
    aggregateRenderer,
    backgroundColor,
    clickedPile,
    coverAggregator,
    depiledPile,
    depileMethod,
    easing,
    grid,
    itemAlignment,
    itemOpacity,
    itemRenderer,
    itemRotated,
    items,
    itemSizeRange,
    lassoFillColor,
    lassoFillOpacity,
    lassoStrokeColor,
    lassoStrokeOpacity,
    lassoStrokeSize,
    orderer,
    pileBorderColor,
    pileBorderOpacity,
    pileBorderColorSelected,
    pileBorderOpacitySelected,
    pileBorderColorActive,
    pileBorderOpacityActive,
    pileBackgroundColor,
    pileBackgroundOpacity,
    pileContextMenuItems,
    piles,
    previewAggregator,
    previewBackgroundColor,
    previewBackgroundOpacity,
    previewRenderer,
    previewSpacing,
    scaledPile,
    tempDepileDirection,
    tempDepileOneDNum,
    temporaryDepiledPile
  });

  const rootReducer = (state, action) => {
    if (action.type === 'RESET') {
      state = undefined; // eslint-disable-line no-param-reassign
    }

    return appReducer(state, action);
  };

  return createReduxStore(rootReducer);
};

export default createStore;

export const createAction = {
  initPiles,
  mergePiles,
  movePiles,
  depilePiles,
  setBackgroundColor,
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
  setGrid,
  setItemSizeRange,
  setItemAlignment,
  setItemRotated,
  setClickedPile,
  setScaledPile,
  setDepileMethod,
  setDepiledPile,
  setTemporaryDepiledPile,
  setTempDepileDirection,
  setTempDepileOneDNum,
  setEasing,
  setPreviewSpacing,
  setPreviewBackgroundColor,
  setPreviewBackgroundOpacity,
  setPileBorderColor,
  setPileBorderOpacity,
  setPileBorderColorSelected,
  setPileBorderOpacitySelected,
  setPileBorderColorActive,
  setPileBorderOpacityActive,
  setPileBackgroundColor,
  setPileBackgroundOpacity,
  setPileContextMenuItems
};
