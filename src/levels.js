import {
  createHtmlByTemplate,
  forEach,
  pipe,
  randomString,
  removeAllChildren,
  removeLastChild,
  withConstructor,
  withReadOnlyProperty,
  withStaticProperty
} from '@flekschas/utils';

import createStylesheet from './stylesheet';

const CSS_HASH = randomString(5);

const CSS_PREFIX = `pilingjs-${CSS_HASH}`;

const CSS_BTN_RIGHT_ARROW = [
  `.${CSS_PREFIX}-btn {
  position: relative;
  display: flex;
  align-items: center;
  line-height: 1em;
  height: 2em;
  margin-right: -0.25em;
  padding: 0 0.5em 0 1em;
  border-radius: 0 0.25em 0.25em 0;
}`,
  `li:first-child .${CSS_PREFIX}-btn {
  padding: 0.5em;
  border-radius: 0.25em;
}`,
  `.${CSS_PREFIX}-btn:focus {
  outline: none;
}`,
  `.${CSS_PREFIX}-btn-right-arrow {
  position: relative;
  display: block;
  border-radius: 0;
}`,
  `.${CSS_PREFIX}-btn-right-arrow:after {
  left: 100%;
  top: 50%;
  border: solid transparent;
  content: '';
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
  border-color: rgba(0, 0, 0, 0);
  border-left-color: inherit;
  border-width: 0.5em;
  margin-top: -0.5em;
}`
];

const createLevels = (store, options = { darkMode: false, maxDepth: 3 }) => {
  let darkMode = options.darkMode;
  let maxDepth = options.maxDepth;

  const breadcrumbsEl = document.createElement('nav');
  breadcrumbsEl.style.position = 'absolute';
  breadcrumbsEl.style.top = 0;
  breadcrumbsEl.style.left = 0;
  const breadcrumbsListEl = document.createElement('ol');
  breadcrumbsListEl.style.display = 'flex';
  breadcrumbsListEl.style.margin = 0;
  breadcrumbsListEl.style.padding = 0;
  breadcrumbsListEl.style.listStyle = 'none';
  breadcrumbsEl.appendChild(breadcrumbsListEl);

  const stylesheet = createStylesheet();
  CSS_BTN_RIGHT_ARROW.forEach(stylesheet.addRule);

  let prevStates = [];
  let currStateIds = [];

  const styleNavButtons = () => {
    const textColor = darkMode ? 'white' : 'black';
    const borderColor = darkMode ? '#333' : '#ccc';
    const backgroundColor = darkMode ? 'black' : 'white';

    forEach((button, index, array) => {
      if (index + 1 === array.length) {
        button.style.background = backgroundColor;
        button.style.boxShadow = `inset 0 0 0 1px ${borderColor}`;
        button.style.zIndex = 1;
        button.className = `${CSS_PREFIX}-btn`;
      } else {
        button.style.borderLeftColor = borderColor;
        button.style.background = borderColor;
        button.style.zIndex = array.length - index;
        button.className = `${CSS_PREFIX}-btn ${CSS_PREFIX}-btn-right-arrow`;
      }
      button.style.color = textColor;
    })(breadcrumbsListEl.querySelectorAll('button'));
  };

  const getCurrentStateId = () => currStateIds[currStateIds.length - 1];

  const stringifyPileIds = pileIds => pileIds.sort().join('-');

  const getNextState = pileIds => {
    const currentState = store.export();
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

  const getNumNonEmptyPiles = state =>
    Object.values(state.piles)
      .filter(pile => pile.items.length)
      .reduce((num, pile) => num + pile.items.length, 0);

  const createBreadcrumbTemplate = (state, level) => {
    const label = level === 0 ? 'Root' : `${level}. Level`;
    const size = getNumNonEmptyPiles(state);
    return `<li><button><span><strong>${label}</strong> (${size})</span></button></li>`;
  };

  const backTo = level => () => {
    if (level === 0) {
      leaveAll();
      return;
    }

    const currNumPrevStates = prevStates.length;

    while (prevStates.length > level + 1) {
      removeLastChild(breadcrumbsListEl);
      currStateIds.pop();
      prevStates.pop();
    }

    if (currNumPrevStates > level) {
      leave();
    }
  };

  const addBreadcrumb = (state, level) => {
    const htmlTemplate = createBreadcrumbTemplate(state, level);
    const listItemEl = createHtmlByTemplate(htmlTemplate);
    listItemEl.querySelector('button').addEventListener('click', backTo(level));
    breadcrumbsListEl.appendChild(listItemEl);
    styleNavButtons();
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

    if (prevStates.length === 1) addBreadcrumb(currentState, 0);

    const nextState = getNextState(pileIds);
    store.import(nextState);
    currStateIds = [...currStateIds, nextStateId];

    addBreadcrumb(nextState, prevStates.length);
  };

  const leave = () => {
    if (!prevStates.length) {
      console.warn("Not allowed! You're already on the root level.");
      return;
    }

    removeLastChild(breadcrumbsListEl);
    styleNavButtons();

    currStateIds.pop();
    const prevState = prevStates.pop();
    store.import(prevState);
  };

  const leaveAll = () => {
    if (!prevStates.length) {
      console.warn("Not allowed! You're already on the root level.");
      return;
    }

    removeAllChildren(breadcrumbsListEl);

    store.import(prevStates[0]);
    currStateIds = [];
    prevStates = [];
  };

  const ifNotNull = (v, alternative) => (v === null ? alternative : v);

  const set = ({
    darkMode: newDarkMode = null,
    maxDepth: newMaxDepth = null
  } = {}) => {
    darkMode = ifNotNull(newDarkMode, darkMode);
    maxDepth = ifNotNull(newMaxDepth, maxDepth);
    styleNavButtons();
  };

  const destroy = () => {
    stylesheet.destroy();
  };

  styleNavButtons();

  return pipe(
    withStaticProperty('nav', breadcrumbsEl),
    withReadOnlyProperty('size', () => prevStates.length),
    withConstructor(createLevels)
  )({
    destroy,
    enter,
    leave,
    leaveAll,
    set
  });
};

export default createLevels;
