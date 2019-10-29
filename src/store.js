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

const backgroundColor = setReducer('backgroundColor', 0x000000);
export const setBackgroundColor = newBackgroundColor => ({
  type: 'SET_BACKGROUND_COLOR',
  payload: { backgroundColor: newBackgroundColor }
});

const lassoFillColor = setReducer('lassoFillColor', 0xffffff);
export const setLassoFillColor = newLassoFillColor => ({
  type: 'SET_LASSO_FILL_COLOR',
  payload: { lassoFillColor: newLassoFillColor }
});

const lassoFillOpacity = setReducer('lassoFillOpacity', 0.15);
export const setLassoFillOpacity = newLassoFillOpacity => ({
  type: 'SET_LASSO_FILL_OPACITY',
  payload: { lassoFillOpacity: newLassoFillOpacity }
});

const lassoStrokeColor = setReducer('lassoStrokeColor', 0xffffff);
export const setLassoStrokeColor = newLassoStrokeColor => ({
  type: 'SET_LASSO_STROKE_COLOR',
  payload: { lassoStrokeColor: newLassoStrokeColor }
});

const lassoStrokeOpacity = setReducer('lassoStrokeOpacity', 0.8);
export const setLassoStrokeOpacity = newLassoStrokeOpacity => ({
  type: 'SET_LASSO_STROKE_OPACITY',
  payload: { lassoStrokeOpacity: newLassoStrokeOpacity }
});

const lassoStrokeSize = setReducer('lassoStrokeSize', 1);
export const setLassoStrokeSize = newLassoStrokeSize => ({
  type: 'SET_LASSO_STROKE_SIZE',
  payload: { lassoStrokeSize: newLassoStrokeSize }
});

const itemRenderer = setReducer('itemRenderer');
export const setItemRenderer = newItemRenderer => ({
  type: 'SET_ITEM_RENDERER',
  payload: { itemRenderer: newItemRenderer }
});

const itemOpacity = setReducer('itemOpacity', 1.0);
export const setItemOpacity = newItemOpacity => ({
  type: 'SET_ITEM_OPACITY',
  payload: { itemOpacity: newItemOpacity }
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

const itemSizeRange = setReducer('itemSizeRange', [0.7, 0.9]);
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
export const setTempDepileOneDNum = newtempDepileOneDNum => ({
  type: 'SET_TEMP_DEPILE_ONE_D_NUM',
  payload: { tempDepileOneDNum: newtempDepileOneDNum }
});

const easing = setReducer('easing', cubicInOut);
export const setEasing = newEasing => ({
  type: 'SET_EASING',
  payload: { easing: newEasing }
});

const previewSpacing = setReducer('previewSpacing', 2);
export const setPreviewSpacing = newPreviewSpacing => ({
  type: 'SET_PREVIEW_SPACING',
  payload: { previewSpacing: newPreviewSpacing }
});

const pileBorderColor = setReducer('pileBorderColor', 0x808080);
export const setPileBorderColor = newPileBorderColor => ({
  type: 'SET_PILE_BORDER_COLOR',
  payload: { pileBorderColor: newPileBorderColor }
});

const pileBorderOpacity = setReducer('pileBorderOpacity', 1.0);
export const setPileBorderOpacity = newPileBorderOpacity => ({
  type: 'SET_PILE_BORDER_OPACITY',
  payload: { pileBorderOpacity: newPileBorderOpacity }
});

const pileBorderColorSelected = setReducer('pileBorderColorSelected', 0xeee462);
export const setPileBorderColorSelected = newPileBorderColorSelected => ({
  type: 'SET_PILE_BORDER_COLOR_SELECTED',
  payload: { pileBorderColorSelected: newPileBorderColorSelected }
});

const pileBorderOpacitySelected = setReducer('pileBorderOpacitySelected', 1.0);
export const setPileBorderOpacitySelected = newPileBorderOpacitySelected => ({
  type: 'SET_PILE_BORDER_OPACITY_SELECTED',
  payload: { pileBorderOpacitySelected: newPileBorderOpacitySelected }
});

const pileBorderColorActive = setReducer('pileBorderColorActive', 0xffa5da);
export const setPileBorderColorActive = newPileBorderColorActive => ({
  type: 'SET_PILE_BORDER_COLOR_ACTIVE',
  payload: { pileBorderColorActive: newPileBorderColorActive }
});

const pileBorderOpacityActive = setReducer('pileBorderOpacityActive', 1.0);
export const setPileBorderOpacityActive = newPileBorderOpacityActive => ({
  type: 'SET_PILE_BORDER_Opacity_ACTIVE',
  payload: { pileBorderOpacityActive: newPileBorderOpacityActive }
});

const pileBackgroundColor = setReducer('pileBackgroundColor', 0x000000);
export const setPileBackgroundColor = newPileBackgroundColor => ({
  type: 'SET_PILE_BACKGROUND_COLOR',
  payload: { pileBackgroundColor: newPileBackgroundColor }
});

const pileBackgroundOpacity = setReducer('pileBackgroundOpacity', 0.85);
export const setPileBackgroundOpacity = newPileBackgroundOpacity => ({
  type: 'SET_PILE_BACKGROUND_OPACITY',
  payload: { pileBackgroundOpacity: newPileBackgroundOpacity }
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
    piles,
    previewAggregator,
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
