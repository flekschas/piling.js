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

export const reset = () => ({
  type: 'RESET',
  payload: {}
});

const itemRenderer = setReducer('itemRenderer');
export const setItemRenderer = newItemRenderer => ({
  type: 'SET_ITEM_RENDERER',
  payload: { itemRenderer: newItemRenderer }
});

const previewRenderer = setReducer('previewRenderer');
export const setPreviewRenderer = newPreviewRenderer => ({
  type: 'SET_PREVIEW_RENDERER',
  payload: { previewRenderer: newPreviewRenderer }
});

const aggregateRenderer = setReducer('aggregateRenderer');
export const setAggregateRenderer = newAggregateRenderer => ({
  type: 'SET_AGGREGATE_RENDERER',
  payload: { aggregateRenderer: newAggregateRenderer }
});

const previewAggregator = setReducer('previewAggregator');
export const setPreviewAggregator = newPreviewAggregator => ({
  type: 'SET_PREVIEW_AGGREGATOR',
  payload: { previewAggregator: newPreviewAggregator }
});

const coverAggregator = setReducer('coverAggregator');
export const setCoverAggregator = newCoverAggregator => ({
  type: 'SET_COVER_AGGREGATOR',
  payload: { coverAggregator: newCoverAggregator }
});

const items = setReducer('items', []);
export const setItems = newItems => ({
  type: 'SET_ITEMS',
  payload: { items: newItems }
});

const orderer = setReducer('orderer', createOrderer().rowMajor);
export const setOrderer = newOrderer => ({
  type: 'SET_ORDERER',
  payload: { orderer: newOrderer }
});

const grid = setReducer('grid', []);
export const setGrid = newGrid => ({
  type: 'SET_GRID',
  payload: { grid: newGrid }
});

const itemSizeRange = setReducer('itemSizeRange', [0.5, 0.9]);
export const setItemSizeRange = newItemSizeRange => ({
  type: 'SET_ITEM_SIZE_RANGE',
  payload: { itemSizeRange: newItemSizeRange }
});

const itemAlignment = setReducer('itemAlignment', ['bottom', 'right']);
export const setItemAlignment = newItemAlignment => ({
  type: 'SET_ITEM_ALIGNMENT',
  payload: { itemAlignment: newItemAlignment }
});

const itemRotated = setReducer('itemRotated', false);
export const setItemRotated = newItemRotated => ({
  type: 'SET_ITEM_ROTATED',
  payload: { itemRotated: newItemRotated }
});

const clickedPile = setReducer('clickedPile', []);
export const setClickedPile = newClickedPile => ({
  type: 'SET_CLICKED_PILE',
  payload: { clickedPile: newClickedPile }
});

const scaledPile = setReducer('scaledPile', []);
export const setScaledPile = newScaledPile => ({
  type: 'SET_SCALED_PILE',
  payload: { scaledPile: newScaledPile }
});

// 'originalPos' and 'closestPos'
const depileMethod = setReducer('depileMethod', 'originalPos');
export const setDepileMethod = newDepileMethod => ({
  type: 'SET_DEPILE_METHOD',
  payload: { depileMethod: newDepileMethod }
});

const depiledPile = setReducer('depiledPile', []);
export const setDepiledPile = newDepiledPile => ({
  type: 'SET_DEPILED_PILE',
  payload: { depiledPile: newDepiledPile }
});

const temporaryDepiledPile = setReducer('temporaryDepiledPile', []);
export const setTemporaryDepiledPile = newTemporaryDepiledPile => ({
  type: 'SET_TEMPORARY_DEPILED_PILE',
  payload: { temporaryDepiledPile: newTemporaryDepiledPile }
});

// 'horizontal' or 'vertical'
const tempDepileDirection = setReducer('tempDepileDirection', 'horizontal');
export const setTempDepileDirection = newTempDepileDirection => ({
  type: 'SET_TEMP_DEPILE_DIRECTION',
  payload: { tempDepileDirection: newTempDepileDirection }
});

const tempDepileOneDNum = setReducer('tempDepileOneDNum', 6);
export const settempDepileOneDNum = newtempDepileOneDNum => ({
  type: 'SET_TEMP_DEPILE_ONE_D_NUM',
  payload: { tempDepileOneDNum: newtempDepileOneDNum }
});

const easingFunc = setReducer('easingFunc', cubicInOut);
export const setEasingFunc = newEasingFunc => ({
  type: 'SET_EASING_FUNC',
  payload: { easingFunc: newEasingFunc }
});

const previewSpacing = setReducer('previewSpacing', 0.5);
export const setPreviewSpacing = newPreviewSpacing => ({
  type: 'SET_PREVIEW_SPACING',
  payload: { previewSpacing: newPreviewSpacing }
});

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
export const initPiles = itemLength => ({
  type: 'INIT_PILES',
  payload: { itemLength }
});

export const mergePiles = (pileIds, isDropped) => ({
  type: 'MERGE_PILES',
  payload: { pileIds, isDropped }
});

export const movePiles = movingPiles => ({
  type: 'MOVE_PILES',
  payload: { movingPiles }
});

export const depilePiles = depiledPiles => ({
  type: 'DEPILE_PILES',
  payload: { piles: depiledPiles }
});

const createStore = () => {
  const appReducer = combineReducers({
    itemRenderer,
    previewRenderer,
    aggregateRenderer,
    previewAggregator,
    coverAggregator,
    items,
    piles,
    orderer,
    grid,
    itemSizeRange,
    itemAlignment,
    itemRotated,
    clickedPile,
    scaledPile,
    depiledPile,
    temporaryDepiledPile,
    tempDepileDirection,
    tempDepileOneDNum,
    easingFunc,
    depileMethod,
    previewSpacing
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
