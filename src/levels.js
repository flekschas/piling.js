import {
  createHtmlByTemplate,
  forEach,
  pipe,
  removeAllChildren,
  removeLastChild,
  toVoid,
  withConstructor,
  withReadOnlyProperty,
  withStaticProperty,
} from '@flekschas/utils';

import { ifNotNull } from './utils';

import createStylesheet from './stylesheet';

const CSS_PREFIX = `pilingjs-breadcrumbs-button`;

const CSS_BTN_RIGHT_ARROW = [
  `.${CSS_PREFIX} {
  position: relative;
  display: flex;
  align-items: center;
  line-height: 1em;
  height: 2em;
  margin-right: -0.25em;
  padding: 0 0.5em 0 1em;
  border-radius: 0 0.25em 0.25em 0;
  text-color: black;
  box-shadow: inset 0 0 0 1px #ccc;
  background: white;
}`,
  `.pilingjs-darkmode .${CSS_PREFIX} {
  text-color: white;
  box-shadow: inset 0 0 0 1px #333;
  background: black;
}`,
  `li:first-child .${CSS_PREFIX} {
  padding: 0.5em;
  border-radius: 0.25em;
}`,
  `.${CSS_PREFIX}:focus {
  outline: none;
}`,
  `.${CSS_PREFIX}.${CSS_PREFIX}-right-arrow {
  position: relative;
  display: block;
  border-radius: 0;
  border-left-color: #ccc;
  background: #ccc;
}`,
  `.pilingjs-darkmode .${CSS_PREFIX}.${CSS_PREFIX}-right-arrow {
  border-left-color: #333;
  background: #333;
}`,
  `.${CSS_PREFIX}.${CSS_PREFIX}-right-arrow:hover, .pilingjs-darkmode .${CSS_PREFIX}.${CSS_PREFIX}-right-arrow:hover {
  color: black;
  border-left-color: #ff7ff6;
  box-shadow: inset 0 0 0 1px #ff7ff6;
  background: #ff7ff6;
}`,
  `.${CSS_PREFIX}.${CSS_PREFIX}-right-arrow:after {
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
}`,
];

const createLevels = (
  { element, store },
  {
    darkMode: initialDarkMode = false,
    maxDepth: initialMaxDepth = 3,
    onEnter = toVoid,
    onLeave = toVoid,
  } = {}
) => {
  let darkMode = initialDarkMode;
  let maxDepth = initialMaxDepth;

  const breadcrumbsEl = document.createElement('nav');
  breadcrumbsEl.className = 'pilingjs-breadcrumbs';
  breadcrumbsEl.style.position = 'absolute';
  breadcrumbsEl.style.top = 0;
  breadcrumbsEl.style.left = 0;
  const breadcrumbsListEl = document.createElement('ol');
  breadcrumbsListEl.className = 'pilingjs-breadcrumbs-list';
  breadcrumbsListEl.style.display = 'flex';
  breadcrumbsListEl.style.margin = 0;
  breadcrumbsListEl.style.padding = 0;
  breadcrumbsListEl.style.listStyle = 'none';
  breadcrumbsEl.appendChild(breadcrumbsListEl);

  const stylesheet = createStylesheet();
  CSS_BTN_RIGHT_ARROW.forEach(stylesheet.addRule);

  let prevStates = [];
  let prevSizes = [];
  let currStateIds = [];

  const styleNavButtons = () => {
    forEach((button, index, array) => {
      if (index + 1 === array.length) {
        button.style.zIndex = 1;
        button.className = `${CSS_PREFIX}`;
      } else {
        button.style.zIndex = array.length - index;
        button.className = `${CSS_PREFIX} ${CSS_PREFIX}-right-arrow`;
      }
    })(breadcrumbsListEl.querySelectorAll('button'));
  };

  const getCurrentStateId = () => currStateIds[currStateIds.length - 1];

  const getStateId = (pileIds) => {
    const { piles } = store.state;
    return pileIds
      .flatMap((pileId) => piles[pileId].items)
      .sort()
      .join('-');
  };

  const getNextState = (pileIds) => {
    const currentState = store.export();
    const pileIdIndex = new Set();

    pileIds.forEach((pileId) => {
      currentState.piles[pileId].items.forEach((itemId) =>
        pileIdIndex.add(itemId)
      );
    });

    // "Empty" not selected piles, i.e., set their items to `[]`
    Object.keys(currentState.piles)
      .filter((pileId) => !pileIdIndex.has(pileId))
      .forEach((pileId) => {
        currentState.piles[pileId].items = [];
      });

    return currentState;
  };

  const countItems = (state) =>
    Object.values(state.piles)
      .filter((pile) => pile.items.length)
      .reduce((num, pile) => num + pile.items.length, 0);

  const createBreadcrumbTemplate = (state, level) => {
    const label = level === 0 ? 'Root' : `${level}. Level`;
    const size = countItems(state);
    return `<li><button><span><strong>${label}</strong> (${size})</span></button></li>`;
  };

  const backTo = (level) => () => {
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

  const enter = (pileIds) => {
    const nextStateId = getStateId(pileIds);
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

    const { width, height } = element.getBoundingClientRect();
    prevSizes = [...prevSizes, { width, height }];

    if (prevStates.length === 1) addBreadcrumb(currentState, 0);

    const nextState = getNextState(pileIds);
    store.import(nextState);
    currStateIds = [...currStateIds, nextStateId];

    addBreadcrumb(nextState, prevStates.length);

    onEnter();
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

    const prevSize = prevSizes.pop();
    onLeave(prevSize);
  };

  const leaveAll = () => {
    if (!prevStates.length) {
      console.warn("Not allowed! You're already on the root level.");
      return;
    }

    removeAllChildren(breadcrumbsListEl);

    store.import(prevStates[0]);
    onLeave(prevSizes[0]);

    currStateIds = [];
    prevStates = [];
    prevSizes = [];
  };

  const set = ({
    darkMode: newDarkMode = null,
    maxDepth: newMaxDepth = null,
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
    set,
  });
};

export default createLevels;
