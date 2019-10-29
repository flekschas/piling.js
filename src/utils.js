export const camelToConst = str =>
  str
    .split(/(?=[A-Z])/)
    .join('_')
    .toUpperCase();

/**
 * Extend an object with another object.
 *
 * @param {object} target - Target object or `undefined` if a new object should
 *   be created.
 * @param {object} source - Object to be cloned.
 * @return {object} Cloned `source` object
 */
const extend = (target, source) => {
  if (source === null || typeof source !== 'object') {
    return source;
  }

  if (source.constructor !== Object && source.constructor !== Array) {
    return source;
  }

  if (
    source.constructor === Date ||
    source.constructor === RegExp ||
    source.constructor === Function ||
    source.constructor === String ||
    source.constructor === Number ||
    source.constructor === Boolean
  ) {
    return new source.constructor(source);
  }

  const out = target || new source.constructor();

  Object.keys(source).forEach(attr => {
    out[attr] =
      typeof out[attr] === 'undefined'
        ? extend(undefined, source[attr])
        : out[attr];
  });

  return out;
};

/**
 * Deep clone an object.
 *
 * @param {object} source - Object to be cloned.
 * @return {object} Cloned `source` object.
 */
export const deepClone = source => {
  let target;
  return extend(target, source);
};

export const createWorker = fn => {
  // console.log(fn.toString().match(/^\s*function\s*\(\s*\)\s*\{(([\s\S](?!\}$))*[\s\S])/))
  return new Worker(
    window.URL.createObjectURL(
      new Blob([`(${fn.toString()})()`], { type: 'text/javascript' })
    )
  );
};

export const capitalize = str => `${str[0].toUpperCase()}${str.slice(1)}`;

/**
 * L2 distance between a pair of 2D points
 * @param   {number}  x1  X coordinate of the first point
 * @param   {number}  y1  Y coordinate of the first point
 * @param   {number}  x2  X coordinate of the second point
 * @param   {number}  y2  Y coordinate of the first point
 * @return  {number}  L2 distance
 */
export const dist = (x1, y1, x2, y2) =>
  Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

/**
 * Get the bounding box of a set of 2D positions
 * @param   {array}  positions2d  2D positions to be checked
 * @return  {array}  Quadruple of form `[xMin, yMin, xMax, yMax]` defining the
 *  bounding box
 */
export const getBBox = positions2d => {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (let i = 0; i < positions2d.length; i += 2) {
    xMin = positions2d[i] < xMin ? positions2d[i] : xMin;
    xMax = positions2d[i] > xMax ? positions2d[i] : xMax;
    yMin = positions2d[i + 1] < yMin ? positions2d[i + 1] : yMin;
    yMax = positions2d[i + 1] > yMax ? positions2d[i + 1] : yMax;
  }

  return {
    minX: xMin,
    minY: yMin,
    maxX: xMax,
    maxY: yMax
  };
};

/**
 * From: https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html
 * @param   {Array}  point  Tuple of the form `[x,y]` to be tested.
 * @param   {Array}  polygon  1D list of vertices defining the polygon.
 * @return  {boolean}  If `true` point lies within the polygon.
 */
export const isPileInPolygon = ([px, py] = [], polygon) => {
  let x1;
  let y1;
  let x2;
  let y2;
  let isWithin = false;
  for (let i = 0, j = polygon.length - 2; i < polygon.length; i += 2) {
    x1 = polygon[i];
    y1 = polygon[i + 1];
    x2 = polygon[j];
    y2 = polygon[j + 1];
    if (y1 > py !== y2 > py && px < ((x2 - x1) * (py - y1)) / (y2 - y1) + x1)
      isWithin = !isWithin;
    j = i;
  }
  return isWithin;
};

/**
 * Fast version of `Math.max`. Based on
 *   https://jsperf.com/math-min-max-vs-ternary-vs-if/24 `Math.max` is not
 *   very fast
 * @param   {number}  a  Value A
 * @param   {number}  b  Value B
 * @return  {boolean}  If `true` A is greater than B.
 */
export const max = (a, b) => (a > b ? a : b);

/**
 * Fast version of `Math.min`. Based on
 *   https://jsperf.com/math-min-max-vs-ternary-vs-if/24 `Math.max` is not
 *   very fast
 * @param   {number}  a  Value A
 * @param   {number}  b  Value B
 * @return  {boolean}  If `true` A is smaller than B.
 */
export const min = (a, b) => (a < b ? a : b);

export const cubicInOut = t => {
  // eslint-disable-next-line no-param-reassign
  t *= 2;
  // eslint-disable-next-line no-param-reassign
  const p = (t <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
  return p;
};

export const interpolateNumber = (a, b) => p => a * (1 - p) + b * p;

export const interpolateVector = (a, b) => p =>
  a.map((x, i) => interpolateNumber(x, b[i])(p));

/**
 * Throttle and debounce a function call
 *
 * Throttling a function call means that the function is called at most every
 * `interval` milliseconds no matter how frequently you trigger a call.
 * Debouncing a function call means that the function is called the earliest
 * after `finalWait` milliseconds wait time where the function was not called.
 * Combining the two ensures that the function is called at most every
 * `interval` milliseconds and is ensured to be called with the very latest
 * arguments after after `finalWait` milliseconds wait time at the end.
 *
 * The following imaginary scenario describes the behavior:
 *
 * MS | interval=2 and finalWait=2
 * 01. y(f, 2, 2)(args_01) => f(args_01) call
 * 02. y(f, 2, 2)(args_02) => throttled call
 * 03. y(f, 2, 2)(args_03) => f(args_03) call
 * 04. y(f, 2, 2)(args_04) => throttled call
 * 05. y(f, 2, 2)(args_05) => f(args_05) call
 * 06. y(f, 2, 2)(args_06) => throttled call
 * 07. y(f, 2, 2)(args_07) => f(args_03) call
 * 08. y(f, 2, 2)(args_08) => throttled call
 * 09. nothing
 * 10. y(f, 2, 2)(args_10) => f(args_10) call from debouncing
 *
 * @param   {functon}  func - Function to be throttled and debounced
 * @param   {number}  interval - Throttle intevals in milliseconds
 * @param   {number}  finalWait - Debounce wait time in milliseconds
 * @return  {function} - Throttled and debounced function
 */
export const withThrottleAndDebounce = (func, interval, finalWait) => {
  let timeout;
  let blockedCalls = 0;

  const reset = () => {
    timeout = null;
  };

  const debounced = (...args) => {
    const later = () => {
      // Since we throttle and debounce we should check whether there were
      // actually multiple attempts to call this function after the most recent
      // throttled call. If there were no more calls we don't have to call
      // the function again.
      if (blockedCalls > 0) {
        func(...args);
        blockedCalls = 0;
      }
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, finalWait);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
    reset();
  };

  debounced.immediate = (...args) => {
    func(...args);
  };

  let wait = false;
  const throttled = (request, ...args) => {
    if (!wait) {
      func(...args);
      debounced(...args);

      wait = true;
      blockedCalls = 0;

      setTimeout(() => {
        wait = false;
      }, interval);
    } else {
      blockedCalls++;
    }
  };

  return throttled;
};

export const scaleLinear = () => {
  let domainMin = 0;
  let domainMax = 1;
  let domainSize = 1;
  let rangeMin = 0;
  let rangeMax = 1;
  let rangeSize = 1;

  const scale = value =>
    Math.min(
      rangeMax,
      Math.max(
        rangeMin,
        ((value - domainMin) / domainSize) * rangeSize + rangeMin
      )
    );

  scale.domain = ([newDomainMin, newDomainMax]) => {
    domainMin =
      newDomainMin === newDomainMax ? newDomainMin - 0.5 : newDomainMin;
    domainMax =
      newDomainMin === newDomainMax ? newDomainMax + 0.5 : newDomainMax;
    domainSize = domainMax - domainMin;
    return scale;
  };
  scale.range = ([newRangeMin, newRangeMax]) => {
    rangeMin = newRangeMin;
    rangeMax = newRangeMax;
    rangeSize = rangeMax - rangeMin;
    return scale;
  };

  return scale;
};

export const colorToDecAlpha = (color, defaultAlpha = 1) => {
  if (typeof color === 'string' || color instanceof String) {
    // HEX
    if (color[0] === '#') return [parseInt(color.substr(1), 16), defaultAlpha];

    // RGBA
    if (color.substring(0, 3) === 'rgb') {
      const matches = color.match(/(\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?/);
      return [
        matches
          .slice(1, 4)
          // eslint-disable-next-line no-bitwise
          .map((x, i) => +x << (8 * (2 - i)))
          .reduce((x, sum) => sum + x, 0),
        Number.isNaN(+matches[4]) ? 1 : +matches[4]
      ];
    }

    // RGB
    return [
      color
        .match(/(\d+),\s*(\d+),\s*(\d+)/)
        .slice(1)
        // eslint-disable-next-line no-bitwise
        .map((x, i) => +x << (8 * (2 - i)))
        .reduce((x, dec) => dec + x, 0),
      defaultAlpha
    ];
  }

  return [parseInt(color, 10), defaultAlpha];
};

export const contextMenuTemplate =
  "<style id = 'style'>" +
  '.contextmenu {' +
  'background-color: #fff;' +
  'position: absolute;' +
  'margin: 5px;' +
  'display: none;' +
  'z-index: 2;' +
  '}' +
  '.contextmenu ul {' +
  'list-style: none;' +
  'padding: 0;' +
  'margin: 0' +
  '}' +
  '.contextmenu button {' +
  'height: 40px; ' +
  'width: 150px;' +
  'font-size: 15px;' +
  'color: black;' +
  'background-color: white;' +
  'cursor: pointer;' +
  'outline: none' +
  '}' +
  '.contextmenu button:hover {' +
  'background-color: #555555;' +
  'color: white;' +
  '}' +
  '.contextmenu button:active {' +
  'transform: translateY(1px);' +
  '}' +
  '</style>' +
  "<nav class = 'contextmenu' id = 'contextmenu'>" +
  "<ul style = 'list-style: none; padding: 0;'>" +
  '<li>' +
  "<button id = 'depile-button'>" +
  'depile' +
  '</button>' +
  '</li>' +
  '<li>' +
  "<button id = 'temp-depile-button'>" +
  'temp depile' +
  '</button>' +
  '</li>' +
  '<li>' +
  "<button id = 'grid-button'>" +
  'show grid' +
  '</button>' +
  '</li>' +
  '<li>' +
  "<button id = 'align-button'>" +
  'align by grid' +
  '</button>' +
  '</li>' +
  '<li>' +
  "<button id = 'scale-button'>" +
  'scale up' +
  '</button>' +
  '</li>' +
  '</ul>' +
  '</nav>';
