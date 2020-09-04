import {
  assign,
  identity,
  l2PointDist,
  nextAnimationFrame,
  pipe,
  throttleAndDebounce,
  wait,
  withConstructor,
  withStaticProperty,
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import { ifNotNull } from './utils';

import {
  DEFAULT_DARK_MODE,
  DEFAULT_LASSO_FILL_OPACITY,
  DEFAULT_LASSO_SHOW_START_INDICATOR,
  DEFAULT_LASSO_START_INDICATOR_OPACITY,
  DEFAULT_LASSO_STROKE_OPACITY,
  DEFAULT_LASSO_STROKE_SIZE,
  LASSO_MIN_DELAY,
  LASSO_MIN_DIST,
  LASSO_SHOW_START_INDICATOR_TIME,
  LASSO_HIDE_START_INDICATOR_TIME,
} from './defaults';

const lassoStyleEl = document.createElement('style');
document.head.appendChild(lassoStyleEl);

const lassoStylesheets = lassoStyleEl.sheet;

const addRule = (rule) => {
  const currentNumRules = lassoStylesheets.length;
  lassoStylesheets.insertRule(rule, currentNumRules);
  return currentNumRules;
};

const removeRule = (index) => {
  lassoStylesheets.deleteRule(index);
};

const inAnimation = `${LASSO_SHOW_START_INDICATOR_TIME}ms ease scaleInFadeOut 0s 1 normal backwards`;

const createInAnimationRule = (currentOpacity, currentScale) => `
@keyframes scaleInFadeOut {
  0% {
    opacity: ${currentOpacity};
    transform: translate(-50%,-50%) scale(${currentScale});
  }
  10% {
    opacity: 1;
    transform: translate(-50%,-50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%,-50%) scale(0.9);
  }
}
`;
let inAnimationRuleIndex = null;

const outAnimation = `${LASSO_HIDE_START_INDICATOR_TIME}ms ease fadeScaleOut 0s 1 normal backwards`;

const createOutAnimationRule = (currentOpacity, currentScale) => `
@keyframes fadeScaleOut {
  0% {
    opacity: ${currentOpacity};
    transform: translate(-50%,-50%) scale(${currentScale});
  }
  100% {
    opacity: 0;
    transform: translate(-50%,-50%) scale(0);
  }
}
`;
let outAnimationRuleIndex = null;

const createLasso = ({
  fillColor: initialFillColor = null,
  fillOpacity: initialFillOpacity = DEFAULT_LASSO_FILL_OPACITY,
  isShowStartIndicator: initialIsShowStartIndicator = DEFAULT_LASSO_SHOW_START_INDICATOR,
  isDarkMode: initialIsDarkMode = DEFAULT_DARK_MODE,
  onDraw: initialOnDraw = identity,
  onStart: initialOnStart = identity,
  startIndicatorOpacity: initialStartIndicatorOpacity = DEFAULT_LASSO_START_INDICATOR_OPACITY,
  strokeColor: initialStrokeColor = null,
  strokeOpacity: initialStrokeOpacity = DEFAULT_LASSO_STROKE_OPACITY,
  strokeSize: initialStrokeSize = DEFAULT_LASSO_STROKE_SIZE,
} = {}) => {
  let fillColor = initialFillColor;
  let fillOpacity = initialFillOpacity;
  let isShowStartIndicator = initialIsShowStartIndicator;
  let isDarkMode = initialIsDarkMode;
  let startIndicatorOpacity = initialStartIndicatorOpacity;
  let strokeColor = initialStrokeColor;
  let strokeOpacity = initialStrokeOpacity;
  let strokeSize = initialStrokeSize;

  let onDraw = initialOnDraw;
  let onStart = initialOnStart;

  const lineContainer = new PIXI.Container();
  const fillContainer = new PIXI.Container();
  const lineGfx = new PIXI.Graphics();
  const fillGfx = new PIXI.Graphics();

  lineContainer.addChild(lineGfx);
  fillContainer.addChild(fillGfx);

  const getLassoFillColor = () =>
    fillColor || isDarkMode ? 0xffffff : 0x000000;

  const getLassoStrokeColor = () =>
    fillColor || isDarkMode ? 0xffffff : 0x000000;

  const getBackgroundColor = () =>
    isDarkMode
      ? `rgba(255, 255, 255, ${startIndicatorOpacity})`
      : `rgba(0, 0, 0, ${startIndicatorOpacity})`;

  const startIndicator = document.createElement('div');
  startIndicator.id = 'lasso-start-indicator';
  startIndicator.style.position = 'absolute';
  startIndicator.style.zIndex = 1;
  startIndicator.style.width = '4rem';
  startIndicator.style.height = '4rem';
  startIndicator.style.borderRadius = '4rem';
  startIndicator.style.opacity = 0.5;
  startIndicator.style.transform = 'translate(-50%,-50%) scale(0)';

  let isMouseDown = false;
  let isLasso = false;
  let lassoPos = [];
  let lassoPosFlat = [];
  let lassoPrevMousePos;

  const mouseUpHandler = () => {
    isMouseDown = false;
  };

  const indicatorClickHandler = (event) => {
    const parent = event.target.parentElement;

    if (!parent) return;

    const rect = parent.getBoundingClientRect();

    showStartIndicator([event.clientX - rect.left, event.clientY - rect.top]);
  };

  const indicatorMouseDownHandler = () => {
    isMouseDown = true;
    isLasso = true;
    clear();
    onStart();
  };

  const indicatorMouseLeaveHandler = () => {
    hideStartIndicator();
  };

  window.addEventListener('mouseup', mouseUpHandler);

  const resetStartIndicatorStyle = () => {
    startIndicator.style.opacity = 0.5;
    startIndicator.style.transform = 'translate(-50%,-50%) scale(0)';
  };

  const getCurrentStartIndicatorAnimationStyle = () => {
    const computedStyle = getComputedStyle(startIndicator);
    const opacity = +computedStyle.opacity;
    // The css rule `transform: translate(-1, -1) scale(0.5);` is represented as
    // `matrix(0.5, 0, 0, 0.5, -1, -1)`
    const m = computedStyle.transform.match(/([0-9.-]+)+/g);
    const scale = m ? +m[0] : 1;

    return { opacity, scale };
  };

  const showStartIndicator = async ([x, y]) => {
    await wait(0);

    if (isMouseDown) return;

    let opacity = 0.5;
    let scale = 0;

    if (isShowStartIndicator) {
      const style = getCurrentStartIndicatorAnimationStyle();
      opacity = style.opacity;
      scale = style.scale;
      startIndicator.style.opacity = opacity;
      startIndicator.style.transform = `translate(-50%,-50%) scale(${scale})`;
    }

    startIndicator.style.animation = 'none';

    // See https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Tips
    // why we need to wait for two animation frames
    await nextAnimationFrame(2);

    startIndicator.style.top = `${y}px`;
    startIndicator.style.left = `${x}px`;

    if (inAnimationRuleIndex !== null) removeRule(inAnimationRuleIndex);

    inAnimationRuleIndex = addRule(createInAnimationRule(opacity, scale));

    startIndicator.style.animation = inAnimation;

    await nextAnimationFrame();
    resetStartIndicatorStyle();
  };

  const hideStartIndicator = async () => {
    const { opacity, scale } = getCurrentStartIndicatorAnimationStyle();
    startIndicator.style.opacity = opacity;
    startIndicator.style.transform = `translate(-50%,-50%) scale(${scale})`;

    startIndicator.style.animation = 'none';

    await nextAnimationFrame(2);

    if (outAnimationRuleIndex !== null) removeRule(outAnimationRuleIndex);

    outAnimationRuleIndex = addRule(createOutAnimationRule(opacity, scale));

    startIndicator.style.animation = outAnimation;

    await nextAnimationFrame();
    resetStartIndicatorStyle();
  };

  const draw = () => {
    lineGfx.clear();
    fillGfx.clear();
    if (lassoPos.length) {
      lineGfx.lineStyle(strokeSize, getLassoStrokeColor(), strokeOpacity);
      lineGfx.moveTo(...lassoPos[0]);
      lassoPos.forEach((pos) => {
        lineGfx.lineTo(...pos);
        lineGfx.moveTo(...pos);
      });
      fillGfx.beginFill(getLassoFillColor(), fillOpacity);
      fillGfx.drawPolygon(lassoPosFlat);
    }
    onDraw();
  };

  const extend = (currMousePos) => {
    if (!lassoPrevMousePos) {
      if (!isLasso) {
        isLasso = true;
        onStart();
      }
      lassoPos = [currMousePos];
      lassoPosFlat = [currMousePos[0], currMousePos[1]];
      lassoPrevMousePos = currMousePos;
    } else {
      const d = l2PointDist(
        currMousePos[0],
        currMousePos[1],
        lassoPrevMousePos[0],
        lassoPrevMousePos[1]
      );

      if (d > LASSO_MIN_DIST) {
        lassoPos.push(currMousePos);
        lassoPosFlat.push(currMousePos[0], currMousePos[1]);
        lassoPrevMousePos = currMousePos;
        if (lassoPos.length > 1) {
          draw();
        }
      }
    }
  };

  const extendDb = throttleAndDebounce(
    extend,
    LASSO_MIN_DELAY,
    LASSO_MIN_DELAY
  );

  const clear = () => {
    lassoPos = [];
    lassoPosFlat = [];
    lassoPrevMousePos = undefined;
    draw();
  };

  const end = () => {
    isLasso = false;
    const lassoPoints = [...lassoPos];

    extendDb.cancel();

    clear();

    return lassoPoints;
  };

  const set = ({
    fillColor: newFillColor = null,
    fillOpacity: newFillOpacity = null,
    onDraw: newOnDraw = null,
    onStart: newOnStart = null,
    showStartIndicator: newIsShowStartIndicator = null,
    startIndicatorOpacity: newStartIndicatorOpacity = null,
    strokeColor: newStrokeColor = null,
    strokeOpacity: newStrokeOpacity = null,
    strokeSize: newStrokeSize = null,
    darkMode: newIsDarkMode = null,
  } = {}) => {
    fillColor = ifNotNull(newFillColor, fillColor);
    fillOpacity = ifNotNull(newFillOpacity, fillOpacity);
    onDraw = ifNotNull(newOnDraw, onDraw);
    onStart = ifNotNull(newOnStart, onStart);
    isDarkMode = ifNotNull(newIsDarkMode, isDarkMode);
    isShowStartIndicator = ifNotNull(
      newIsShowStartIndicator,
      isShowStartIndicator
    );
    startIndicatorOpacity = ifNotNull(
      newStartIndicatorOpacity,
      startIndicatorOpacity
    );
    strokeColor = ifNotNull(newStrokeColor, strokeColor);
    strokeOpacity = ifNotNull(newStrokeOpacity, strokeOpacity);
    strokeSize = ifNotNull(newStrokeSize, strokeSize);

    startIndicator.style.background = getBackgroundColor();

    if (isShowStartIndicator) {
      startIndicator.addEventListener('click', indicatorClickHandler);
      startIndicator.addEventListener('mousedown', indicatorMouseDownHandler);
      startIndicator.addEventListener('mouseleave', indicatorMouseLeaveHandler);
    } else {
      startIndicator.removeEventListener(
        'mousedown',
        indicatorMouseDownHandler
      );
      startIndicator.removeEventListener(
        'mouseleave',
        indicatorMouseLeaveHandler
      );
    }
  };

  const destroy = () => {
    window.removeEventListener('mouseup', mouseUpHandler);
    startIndicator.removeEventListener('click', indicatorClickHandler);
    startIndicator.removeEventListener('mousedown', indicatorMouseDownHandler);
    startIndicator.removeEventListener(
      'mouseleave',
      indicatorMouseLeaveHandler
    );
  };

  const withPublicMethods = () => (self) =>
    assign(self, {
      clear,
      destroy,
      end,
      extend,
      extendDb,
      set,
      showStartIndicator,
    });

  set({
    fillColor,
    fillOpacity,
    isShowStartIndicator,
    isDarkMode,
    onDraw,
    onStart,
    startIndicatorOpacity,
    strokeColor,
    strokeOpacity,
    strokeSize,
  });

  return pipe(
    withStaticProperty('startIndicator', startIndicator),
    withStaticProperty('fillContainer', fillContainer),
    withStaticProperty('lineContainer', lineContainer),
    withPublicMethods(),
    withConstructor(createLasso)
  )({});
};

export default createLasso;
