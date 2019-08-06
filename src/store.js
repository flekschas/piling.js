import deepEqual from 'deep-equal';
import { createStore as createReduxStore, combineReducers } from 'redux';

import creatOrderer from './orderer';
import { camelToConst, deepClone } from './utils';

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

const items = setReducer('items', []); // how to update the store
export const setItems = newItems => ({
  // action to trigger update
  type: 'SET_ITEMS',
  payload: { items: newItems }
});

const orderer = setReducer('orderer', creatOrderer().rowMajor);
export const setOrderer = newOrderer => ({
  type: 'SET_ORDERER',
  payload: { orderer: newOrderer }
});

const grid = setReducer('grid', []);
export const setGrid = newGrid => ({
  type: 'SET_GRID',
  payload: { grid: newGrid }
});

const createStore = () => {
  const appReducer = combineReducers({
    // This defines what is on our store
    itemRenderer,
    items,
    orderer,
    grid
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
