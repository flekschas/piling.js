import * as PIXI from 'pixi.js';

export const cloneSprite = sprite => {
  const clonedSprite = new PIXI.Sprite(sprite.texture);
  clonedSprite.interactive = sprite.interactive;
  clonedSprite.x = sprite.x;
  clonedSprite.y = sprite.y;
  clonedSprite.anchor = sprite.anchor;
  clonedSprite.width = sprite.width;
  clonedSprite.height = sprite.height;
  clonedSprite.angle = sprite.angle;

  return clonedSprite;
};

/**
 * L1 distance between a pair of 2D points
 * @param   {number}  fromX  X coordinate of the first point
 * @param   {number}  fromY  Y coordinate of the first point
 * @param   {number}  toX  X coordinate of the second point
 * @param   {number}  toY  Y coordinate of the first point
 * @return  {number}  L1 distance
 */
export const l1Dist = (fromX, fromY, toX, toY) =>
  Math.abs(fromX - toX) + Math.abs(fromY - toY);

/**
 * L2 distance between a pair of 2D points
 * @param   {number}  fromX  X coordinate of the first point
 * @param   {number}  fromY  Y coordinate of the first point
 * @param   {number}  toX  X coordinate of the second point
 * @param   {number}  toY  Y coordinate of the first point
 * @return  {number}  L2 distance
 */
export const l2Dist = (fromX, fromY, toX, toY) =>
  Math.sqrt((fromX - toX) ** 2 + (fromY - toY) ** 2);

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

export const ifNotNull = (v, alternative = null) =>
  v === null ? alternative : v;

/**
 * Convert a 2D vector to it's homoegeneous 3D counterpart
 * @param   {number}  x  X coordinate
 * @param   {number}  y  Y coordinate
 * @return  {array}  Quadruple representing the homogeneous vector
 */
export const toHomogeneous = (x, y) => [x, y, 0, 1];

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
        rangeMax - ((domainMax - value) / domainSize) * rangeSize
      )
    );

  scale.domain = (newDomain = []) => {
    if (newDomain.length === 0) return [domainMin, domainMax];

    const [newDomainMin, newDomainMax] = newDomain;

    domainMin = newDomainMin;
    domainMax = newDomainMax;

    domainSize = domainMax - domainMin || 1;

    return scale;
  };

  scale.range = (newRange = []) => {
    if (newRange.length === 0) return [rangeMin, rangeMax];

    const [newRangeMin, newRangeMax] = newRange;

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
