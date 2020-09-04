import { identity } from '@flekschas/utils';
import * as tf from '@tensorflow/tfjs-core';
import { openArray } from 'zarr';

tf.setBackend('cpu');

function decode({ data, shape }) {
  const channelSize = data.length / shape[0];
  return Array(shape[0])
    .fill()
    .map((_, i) => {
      const rgba = new Float32Array(channelSize);
      rgba.set(data.subarray(channelSize * i, channelSize * i + channelSize));
      return rgba;
    });
}

export async function loadZarr({ connections, x, y, z }) {
  const rawData = await connections[z].getRawChunk([0, y, x]);
  return [x, y, z, decode(rawData)];
}

export const getZarr = (connections) => ({ x, y, z }) =>
  loadZarr({
    x,
    y,
    z: -z,
    connections,
  });

export async function initZarr({ sourceChannels, minZoom }) {
  const rootZarrUrl = Object.values(sourceChannels)[0]; // all are the same so get first

  // Known issue with how zarr.js does string concatenation for urls
  // The prefix gets chunked off for some reason and must be repeating in the config.
  // https://github.com/gzuidhof/zarr.js/issues/36
  const prefix = rootZarrUrl.split('/').slice(-1)[0];

  // Not necessary but this is something we should be parsing from metadata
  const maxLevel = -minZoom;

  const zarrStores = Array(maxLevel)
    .fill()
    .map((_, i) => {
      const config = {
        store: rootZarrUrl,
        path: `${prefix}/${String(i).padStart(2, '0')}`,
        mode: 'r',
      };
      return openArray(config);
    });
  const connections = await Promise.all(zarrStores);

  // Get other properties for image viewer

  // Somewhat hard coded for now, but good to keep all this logic in the data loaders so we can edit in the future.
  const baseLayer = connections[0]; // shape [4, 36040, 52660]
  // last two dimensions of the 3D array are width and height
  const [imageHeight, imageWidth] = baseLayer.shape.slice(1);
  // chunks are [4, 512, 512], grab last dimentsion. Maybe add check for if last two are the same?
  const tileSize = baseLayer.chunks.slice(-1)[0];

  // Ideally we will also have metadata here about the minZoom so it's not a parameter supplied in App.js
  return { connections, imageHeight, imageWidth, tileSize, minZoom };
}

export async function getZarrMetadata({ channels, minZoom }) {
  function range(len) {
    return [...Array(len).keys()];
  }

  const rootZarrUrl = Object.values(channels)[0]; // all are the same so get first

  // Known issue with how zarr.js does string concatenation for urls
  // The prefix gets chunked off for some reason and must be repeating in the config.
  // https://github.com/gzuidhof/zarr.js/issues/36
  const prefix = rootZarrUrl.split('/').slice(-1)[0];

  // Not necessary but this is something we should be parsing from metadata
  const maxLevel = -minZoom;

  const zarrStores = range(maxLevel).map((i) => {
    const config = {
      store: rootZarrUrl,
      path: `${prefix}/${String(i).padStart(2, '0')}`,
      mode: 'r',
    };
    return openArray(config);
  });
  const connections = await Promise.all(zarrStores);

  // Get other properties for image viewer

  // Somewhat hard coded for now, but good to keep all this logic in the data loaders so we can edit in the future.
  const baseLayer = connections[0]; // shape [4, 36040, 52660]
  // last two dimensions of the 3D array are width and height
  const [imageHeight, imageWidth] = baseLayer.shape.slice(1);
  // chunks are [4, 512, 512], grab last dimentsion. Maybe add check for if last two are the same?
  const tileSize = baseLayer.chunks.slice(-1)[0];

  // Ideally we will also have metadata here about the minZoom so it's not a parameter supplied in App.js
  return { connections, imageHeight, imageWidth, tileSize, minZoom };
}

export const getExactData = async ({
  numChannels,
  tileIndices,
  getData,
  viewport,
  tileSize,
}) => {
  const tiles = await Promise.all(tileIndices.map(getData));
  let minI = Infinity;
  let maxI = -Infinity;
  let minJ = Infinity;
  let maxJ = -Infinity;
  tileIndices.forEach(({ x, y }) => {
    minI = Math.min(minI, y);
    maxI = Math.max(maxI, y);
    minJ = Math.min(minJ, x);
    maxJ = Math.max(maxJ, x);
  });

  const numRows = maxI - minI + 1;
  const numCols = maxJ - minJ + 1;

  const tileData2d = Array(numChannels)
    .fill()
    .map(() =>
      Array(numRows)
        .fill()
        .map(() => [])
    );

  tiles.forEach(([x, y, z, channels]) => {
    const tileBBox = tileIdxToScreen({ x, y, z, tileSize });
    const tileViewport = screenToTile({
      screen: viewport,
      tile: tileBBox,
      z,
      tileSize,
    });

    channels.forEach((channel, i) => {
      tileData2d[i][y - minI][x - minJ] = tf
        .tensor2d(channel, [tileSize, tileSize])
        .slice(
          [tileViewport.minY, tileViewport.minX],
          [
            tileViewport.maxY - tileViewport.minY,
            tileViewport.maxX - tileViewport.minX,
          ]
        );
    });
  });

  if (numRows === 1 && numCols === 1) {
    return Promise.all(tileData2d.map((channel) => channel[0][0].buffer()));
  }

  return Promise.all(
    tileData2d.map((channel) => {
      const rowData =
        numCols > 1
          ? channel.map((rowTensors) => tf.concat(rowTensors, 1))
          : channel.flatMap(identity);

      const outData = rowData.length > 1 ? tf.concat(rowData, 0) : rowData[0];

      return outData.buffer();
    })
  );
};

export const tileIdxToScreen = ({ x, y, z, tileSize }) => ({
  minX: x * tileSize * 2 ** z,
  minY: y * tileSize * 2 ** z,
  maxX: (x + 1) * tileSize * 2 ** z,
  maxY: (y + 1) * tileSize * 2 ** z,
});

export const screenToTile = ({ screen, tile, z, tileSize }) => {
  const tilePixelSize = 2 ** z;

  let minX = Math.round((screen.minX - tile.minX) / tilePixelSize);
  minX = Math.max(0, minX);

  let minY = Math.round((screen.minY - tile.minY) / tilePixelSize);
  minY = Math.max(0, minY);

  let maxX = Math.round((screen.maxX - tile.minX) / tilePixelSize);
  maxX = Math.max(minX, Math.min(tileSize, maxX));

  let maxY = Math.round((screen.maxY - tile.minY) / tilePixelSize);
  maxY = Math.max(minY, Math.min(tileSize, maxY));

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
};

const pixelsToTileIndex = (x, z, tileSize) => x / (tileSize * 2 ** -z);

export function getRasterTileIndices({
  viewport,
  minZoom,
  tileSize,
  imageWidth,
  imageHeight,
}) {
  const z = Math.min(0, Math.ceil(viewport.zoom));
  const scale = tileSize * 2 ** -z;
  const maxXTilePossible = Math.ceil(imageWidth / scale);
  const maxYTilePossible = Math.ceil(imageHeight / scale);

  if (z < minZoom) return [];

  const minXTile = pixelsToTileIndex(viewport.minX, z, tileSize);
  const minYTile = pixelsToTileIndex(viewport.minY, z, tileSize);
  const maxXTile = pixelsToTileIndex(viewport.maxX, z, tileSize);
  const maxYTile = pixelsToTileIndex(viewport.maxY, z, tileSize);

  /*
    |  TILE  |  TILE  |  TILE  |
    |(minX)           |(maxX)
    |(roundedMinX)    |(roundedMaxX)
  */
  const roundedMinX = Math.max(0, Math.floor(minXTile));
  const roundedMaxX = Math.min(
    maxXTilePossible,
    Math.max(0, Math.ceil(maxXTile))
  );
  const roundedMinY = Math.max(0, Math.floor(minYTile));
  const roundedMaxY = Math.min(
    maxYTilePossible,
    Math.max(0, Math.ceil(maxYTile))
  );

  const indices = [];
  for (let x = roundedMinX; x < roundedMaxX; x += 1) {
    for (let y = roundedMinY; y < roundedMaxY; y += 1) {
      indices.push({ x, y, z });
    }
  }
  return indices;
}

export const rgb2hsv = ([r, g, b]) => {
  let h;
  let s;
  const rabs = r / 255;
  const gabs = g / 255;
  const babs = b / 255;
  const v = Math.max(rabs, gabs, babs);
  const diff = v - Math.min(rabs, gabs, babs);
  const diffc = (c) => (v - c) / 6 / diff + 1 / 2;
  if (diff === 0) {
    h = 0;
    s = 0;
  } else {
    s = diff / v;
    const rr = diffc(rabs);
    const gg = diffc(gabs);
    const bb = diffc(babs);

    if (rabs === v) {
      h = bb - gg;
    } else if (gabs === v) {
      h = 1 / 3 + rr - bb;
    } else if (babs === v) {
      h = 2 / 3 + gg - rr;
    }
    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }
  return [h, s, v];
};
