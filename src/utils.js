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
