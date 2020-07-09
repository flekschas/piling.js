/**
 * Get the bounding box of a set of 2D positions
 * @param   {array}  positions2d  2D positions to be checked
 * @return  {array}  Quadruple of form `[xMin, yMin, xMax, yMax]` defining the
 *  bounding box
 */
const getBBox = (positions2d) => {
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
    maxY: yMax,
  };
};

export default getBBox;
