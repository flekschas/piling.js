import createScale from './utils/scale';

const LAT_EXTENT = 85.051129;
const MAX_EXTENT = 20037508.342789244;

const xToU = createScale().domain([-MAX_EXTENT, MAX_EXTENT]);
const uToX = createScale().range([-MAX_EXTENT, MAX_EXTENT]);

const llToXy = (lon, lat) => {
  let x = (lon * MAX_EXTENT) / 180;
  let y =
    (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) * MAX_EXTENT) / Math.PI;

  if (x > MAX_EXTENT) x = MAX_EXTENT;
  if (x < -MAX_EXTENT) x = -MAX_EXTENT;
  if (y > MAX_EXTENT) y = MAX_EXTENT;
  if (y < -MAX_EXTENT) y = -MAX_EXTENT;

  return [x, y];
};

// Convert 900913 x/y values to lon/lat.
const xyToLl = (x, y) => {
  const lng = (x * 180) / MAX_EXTENT;
  let lat =
    (Math.atan(Math.exp((y * Math.PI) / MAX_EXTENT)) * 360) / Math.PI - 90;

  if (lat > LAT_EXTENT) lat = LAT_EXTENT;
  if (lat < -LAT_EXTENT) lat = -LAT_EXTENT;

  return [lng, lat];
};

const createBoundedMercator = (initWidth, initHeight) => {
  let weight = initWidth;
  let height = initHeight;
  let xPad = (weight - height) / 2;

  const toPx = (lngLat) => {
    const [x, y] = llToXy(lngLat[0], lngLat[1]);
    return [xToU(x) * height + xPad, xToU(-y) * height];
  };

  const toLl = (xy) => {
    const u = (xy[0] - xPad) / height;
    const v = xy[1] / height;
    return xyToLl(uToX(u), -uToX(v));
  };

  const updateBounds = (newWidth, newHeight) => {
    weight = newWidth;
    height = newHeight;
    xPad = (weight - height) / 2;
  };

  return {
    toPx,
    toLl,
    updateBounds,
  };
};

export default createBoundedMercator;
