import {
  assign,
  identity,
  l2PointDist,
  pipe,
  throttleAndDebounce,
  wait,
  withConstructor,
  withStaticProperty
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import { LASSO_MIN_DELAY, LASSO_MIN_DIST } from './defaults';

const lassoStyleEl = document.createElement('style');
document.head.appendChild(lassoStyleEl);

const lassoStylesheets = lassoStyleEl.sheet;

const scaleInFadeOut = `
@keyframes scaleInFadeOut {
  0% {
    opacity: 0;
    transform: translate(-50%,-50%) scale(0);
  }
  10% {
    opacity: 1;
    transform: translate(-50%,-50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%,-50%) scale(1);
  }
}
`;

lassoStylesheets.insertRule(scaleInFadeOut, lassoStylesheets.length);

const indicatorAnimation = '3s scaleInFadeOut backwards';

const createLasso = ({
  fillColor: initialFillColor,
  fillOpacity: initialFillOpacity,
  strokeColor: initialStrokeColor,
  strokeOpacity: initialStrokeOpacity,
  strokeSize: initialStrokeSize,
  onStart: initialOnStart = identity,
  onDraw: initialOnDraw = identity,
  isDarkMode: initialIsDarkMode = false
} = {}) => {
  let fillColor = initialFillColor;
  let fillOpacity = initialFillOpacity;
  let onDraw = initialOnDraw;
  let onStart = initialOnStart;
  let strokeColor = initialStrokeColor;
  let strokeOpacity = initialStrokeOpacity;
  let strokeSize = initialStrokeSize;
  let isDarkMode = initialIsDarkMode;

  const lineContainer = new PIXI.Container();
  const fillContainer = new PIXI.Container();
  const lineGfx = new PIXI.Graphics();
  const fillGfx = new PIXI.Graphics();

  lineContainer.addChild(lineGfx);
  fillContainer.addChild(fillGfx);

  const startIndicator = document.createElement('div');
  startIndicator.id = 'lasso-start-indicator';
  startIndicator.style.position = 'absolute';
  startIndicator.style.zIndex = 1;
  startIndicator.style.width = '4rem';
  startIndicator.style.height = '4rem';
  startIndicator.style.borderRadius = '4rem';
  startIndicator.style.background = isDarkMode
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.1)';
  startIndicator.style.opacity = '0.5';
  startIndicator.style.transform = 'translate(-50%,-50%) scale(0)';

  let isMouseDown = false;
  let lassoPos = [];
  let lassoPosFlat = [];
  let lassoPrevMousePos;

  const mouseUpHandler = () => {
    isMouseDown = false;
  };

  const indicatorMouseDownHandler = () => {
    isMouseDown = true;
    clear();
    onStart();
  };

  window.addEventListener('mouseup', mouseUpHandler);
  startIndicator.addEventListener('mousedown', indicatorMouseDownHandler);

  const showStartIndicator = async ([x, y]) => {
    await wait(0);

    if (isMouseDown) return;

    startIndicator.style.animation = 'none';

    await wait(10);

    startIndicator.style.top = `${y}px`;
    startIndicator.style.left = `${x}px`;
    startIndicator.style.animation = indicatorAnimation;
  };

  const draw = () => {
    lineGfx.clear();
    fillGfx.clear();
    if (lassoPos.length) {
      lineGfx.lineStyle(strokeSize, strokeColor, strokeOpacity);
      lineGfx.moveTo(...lassoPos[0]);
      lassoPos.forEach(pos => {
        lineGfx.lineTo(...pos);
        lineGfx.moveTo(...pos);
      });
      fillGfx.beginFill(fillColor, fillOpacity);
      fillGfx.drawPolygon(lassoPosFlat);
    }
    onDraw();
  };

  const extend = currMousePos => {
    if (!lassoPrevMousePos) {
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
    const lassoPolygon = [...lassoPosFlat];

    clear();

    return lassoPolygon;
  };

  const set = ({
    fillColor: newFillColor = null,
    fillOpacity: newFillOpacity = null,
    onDraw: newOnDraw = null,
    onStart: newOnStart = null,
    strokeColor: newStrokeColor = null,
    strokeOpacity: newStrokeOpacity = null,
    strokeSize: newStrokeSize = null,
    isDarkMode: newisDarkMode = null
  } = {}) => {
    fillColor = newFillColor === null ? fillColor : newFillColor;
    fillOpacity = newFillOpacity === null ? fillOpacity : newFillOpacity;
    onDraw = newOnDraw === null ? onDraw : newOnDraw;
    onStart = newOnStart === null ? onStart : newOnStart;
    strokeColor = newStrokeColor === null ? strokeColor : newStrokeColor;
    strokeOpacity =
      newStrokeOpacity === null ? strokeOpacity : newStrokeOpacity;
    strokeSize = newStrokeSize === null ? strokeSize : newStrokeSize;
    isDarkMode = newisDarkMode === null ? isDarkMode : newisDarkMode;

    startIndicator.style.background = isDarkMode
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)';
  };

  const destroy = () => {
    window.removeEventListener('mouseup', mouseUpHandler);
    startIndicator.removeEventListener('mousedown', indicatorMouseDownHandler);
  };

  const withPublicMethods = () => self =>
    assign(self, {
      clear,
      destroy,
      end,
      extend,
      extendDb,
      set,
      showStartIndicator
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
