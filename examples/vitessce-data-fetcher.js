import {
  getExactData,
  getZarr,
  getZarrMetadata,
  getRasterTileIndices,
} from './vitessce-utils';

const createDataFetcher = async ({ channels, minZoom }) => {
  const {
    connections,
    imageHeight,
    imageWidth,
    tileSize,
  } = await getZarrMetadata({
    channels,
    minZoom,
  });

  const getData = getZarr(connections);

  return (viewport) => {
    const tileIndices = getRasterTileIndices({
      viewport,
      imageHeight,
      imageWidth,
      tileSize,
      minZoom,
    });

    return getExactData({
      numChannels: Object.keys(channels).length,
      tileIndices,
      getData,
      viewport,
      tileSize,
    });
  };
};

export default createDataFetcher;
