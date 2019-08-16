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

// reducer
const piles = (previousState = [], action) => {
  switch (action.type) {
    case 'INIT_PILES': {
      const itemIds = [];
      for (let i = 0; i < action.payload.itemLength; i++) {
        itemIds.push(i);
      }
      return itemIds.map(id => ({
        items: [id],
        x: 0,
        y: 0
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
        newState[source] = {};
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
          newState[id] = {};
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

const createStore = () => {
  const appReducer = combineReducers({
    // This defines what is on our store
    itemRenderer,
    items,
    piles,
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
