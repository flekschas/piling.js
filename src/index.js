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

  // automatically render?
  const ticker = PIXI.Ticker.shared;
  ticker.add(() => {
    renderer.render(stage);
  });

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

  const hover = image => {
    const graphics = new PIXI.Graphics();
    stage.addChild(graphics);

    const drawBound = () => {
      const rect = image.getBounds();

      graphics.lineStyle(2, 0xfeeb77, 1);
      graphics.beginFill(0x650a5a, 0);
      graphics.drawRect(
        rect.x - 2,
        rect.y - 2,
        rect.width + 4,
        rect.height + 4
      );
      graphics.endFill();
    };

    function onButtonDown() {
      this.isdown = true;
      graphics.clear();
      drawBound();
    }

    function onButtonUp() {
      this.isdown = false;
      if (this.isOver) {
        graphics.clear();
        drawBound();
      } else {
        graphics.clear();
      }
    }

    function onButtonOver() {
      this.isOver = true;
      graphics.clear();
      drawBound();
    }

    function onButtonOut() {
      this.isOver = false;
      graphics.clear();
    }

    function onButtonMove() {
      if (this.isdown) {
        graphics.clear();
        drawBound();
      }
    }

    image
      .on('pointerdown', onButtonDown)
      .on('pointerup', onButtonUp)
      .on('pointerupoutside', onButtonUp)
      .on('pointerover', onButtonOver)
      .on('pointerout', onButtonOut)
      .on('pointermove', onButtonMove);
  };

  const drag = image => {
    function onDragStart(event) {
      // store a reference to the data
      // the reason for this is because of multitouch
      // we want to track the movement of this particular touch
      this.data = event.data;
      this.alpha = 0.5;
      this.dragging = true;
    }

    function onDragEnd() {
      this.alpha = 1;
      this.dragging = false;
      // set the interaction data to null
      this.data = null;
    }

    function onDragMove() {
      if (this.dragging) {
        const newPosition = this.data.getLocalPosition(this.parent);
        this.x = newPosition.x;
        this.y = newPosition.y;
      }
    }

    image
      .on('pointerdown', onDragStart)
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      .on('pointermove', onDragMove);
  };

  const interactWith = image => {
    // eslint-disable-next-line no-param-reassign
    image.interactive = true;
    // eslint-disable-next-line no-param-reassign
    image.buttonMode = true;
    image.anchor.set(0.5);
    // eslint-disable-next-line no-param-reassign
    image.x = image.width / 2;
    // eslint-disable-next-line no-param-reassign
    image.y = image.height / 2;

    drag(image);
    hover(image);
  };

  const createItems = () => {
    const { itemRenderer, items } = store.getState();

    stage.removeChildren();

    const renderItems = items.map(({ src }) => itemRenderer(src));

    return Promise.all(renderItems).then(itemsA => {
      itemsA.forEach(item => {
        interactWith(item); // when to call the function?
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
