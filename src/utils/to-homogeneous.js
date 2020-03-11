/**
 * Convert a 2D vector to it's homoegeneous 3D counterpart
 * @param   {number}  x  X coordinate
 * @param   {number}  y  Y coordinate
 * @return  {array}  Quadruple representing the homogeneous vector
 */
const toHomogeneous = (x, y) => [x, y, 0, 1];

export default toHomogeneous;
