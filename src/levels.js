import { pipe, withConstructor, withStaticProperty } from '@flekschas/utils';

const createLevels = (store, { maxDepth = 3 } = {}) => {
  const baseEl = document.createElement('div');
  const breadcrumbsEl = document.createElement('nav');
  let prevStates = [];
  let currStateIds = [];

  const getCurrentStateId = () => currStateIds[currStateIds.length - 1];

  const stringifyPileIds = pileIds => pileIds.sort().join('-');

  const getNextState = (currentState, pileIds) => {
    const pileIdIndex = new Set();

    pileIds.forEach(pileId => {
      currentState.piles[pileId].items.forEach(itemId =>
        pileIdIndex.add(itemId)
      );
    });

    // "Empty" not selected piles, i.e., set their items to `[]`
    Object.keys(currentState.piles)
      .filter(pileId => !pileIdIndex.has(pileId))
      .forEach(pileId => {
        currentState.piles[pileId].items = [];
      });

    return currentState;
  };

  const enter = pileIds => {
    const nextStateId = stringifyPileIds(pileIds);
    const currStateId = getCurrentStateId();

    if (prevStates.length >= maxDepth) {
      console.warn(`Not allowed! You reached the maximum depth (${maxDepth})`);
      return;
    }

    if (nextStateId === currStateId) {
      console.warn("Not allowed! You're already on this level.");
      return;
    }

    const currentState = store.export();
    prevStates = [...prevStates, currentState];

    const nextState = getNextState(currentState, pileIds);
    store.import(nextState);
    prevStates = [...currStateIds, nextStateId];
  };

  const leave = () => {
    if (!prevStates.prevStates) {
      console.warn("Not allowed! You're already on the root level.");
      return;
    }

    currStateIds.pop();
    const prevState = prevStates.pop();
    store.import(prevState);
  };

  const leaveAll = () => {
    if (!prevStates.prevStates) {
      console.warn("Not allowed! You're already on the root level.");
      return;
    }

    store.import(prevStates[0]);
    currStateIds = [];
    prevStates = [];
  };

  return pipe(
    withStaticProperty('baseEl', baseEl),
    withStaticProperty('breadcrumbsEl', breadcrumbsEl),
    withConstructor(createLevels)
  )({
    enter,
    leave,
    leaveAll
  });
};

export default createLevels;
