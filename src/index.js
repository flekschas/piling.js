import * as PIXI from 'pixi.js';
import createPubSub from 'pub-sub-es';
import withRaf from 'with-raf';

import createStore, { setItemRenderer, setItems } from './store';

const createPileMe = rootElement => {
  const canvas = document.createElement('canvas');
  const pubSub = createPubSub();
  const store = createStore();

  let state = store.getState();

  const renderer = new PIXI.Renderer({
    width: rootElement.getBoundingClientRect().width,
    height: rootElement.getBoundingClientRect().height,
    view: canvas,
    antialias: true,
    transparent: true,
    resolution: 2,
    autoResize: true
  });

  const stage = new PIXI.Container();
  stage.interactive = true;

  const get = property => {
    switch (property) {
      case 'renderer':
        return state.itemRenderer;

      case 'items':
        return state.items;

      default:
        console.warn(`Unknown property "${property}"`);
        return undefined;
    }
  };

  const set = (property, value) => {
    let action;

    switch (property) {
      case 'renderer':
        action = setItemRenderer(value);
        break;

      case 'items':
        action = setItems(value);
        break;

      default:
        console.warn(`Unknown property "${property}"`);
    }

    if (action) store.dispatch(action);
  };

  const render = () => {
    renderer.render(stage);
  };

  const renderRaf = withRaf(render);

  // const withRender = f => (...args) => {
  //   const out = f(...args);
  //   renderRaf();
  //   return out;
  // };

  const createItems = () => {
    const { itemRenderer, items } = store.getState();

    stage.removeChildren();

    const renderItems = items.map(({ src }) => itemRenderer(src));

    return Promise.all(renderItems).then(itemsA => {
      itemsA.forEach(item => {
        stage.addChild(item);
      });
      render();
    });
  };

  const updated = () => {
    const newState = store.getState();

    if (
      state.items !== newState.items ||
      state.itemRenderer !== newState.itemRenderer
    )
      createItems();

    state = newState;
  };

  const init = () => {
    // Setup event handler
    window.addEventListener('blur', () => {}, false);
    window.addEventListener('mousedown', () => {}, false);
    window.addEventListener('mouseup', () => {}, false);
    window.addEventListener('mousemove', () => {}, false);
    canvas.addEventListener('mouseenter', () => {}, false);
    canvas.addEventListener('mouseleave', () => {}, false);
    canvas.addEventListener('click', () => {}, false);
    canvas.addEventListener('dblclick', () => {}, false);

    store.subscribe(updated);
    rootElement.appendChild(canvas);
  };

  const destroy = () => {
    // Remove event listeners
    window.removeEventListener('keyup', () => {}, false);
    window.removeEventListener('blur', () => {}, false);
    window.removeEventListener('mousedown', () => {}, false);
    window.removeEventListener('mouseup', () => {}, false);
    window.removeEventListener('mousemove', () => {}, false);
    canvas.removeEventListener('mouseenter', () => {}, false);
    canvas.removeEventListener('mouseleave', () => {}, false);
    canvas.removeEventListener('click', () => {}, false);
    canvas.removeEventListener('dblclick', () => {}, false);

    stage.destroy(false);
    renderer.destroy(true);
    store.unsubscribe(updated);

    rootElement.removeChild(canvas);
    pubSub.clear();
  };

  init();

  return {
    destroy,
    get,
    render: renderRaf,
    set,
    subscribe: pubSub.subscribe,
    unsubscribe: pubSub.unsubscribe
  };
};

export default createPileMe;
