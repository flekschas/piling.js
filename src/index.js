import createPilingJs from './library';

export {
  createMatrixPreviewAggregator,
  createMatrixCoverAggregator,
  createRepresentativeAggregator,
} from './aggregator';

export { createDbscan, createKmeans } from './clusterer';

export {
  createImageRenderer,
  createMatrixRenderer,
  createRepresentativeRenderer,
  createSvgRenderer,
} from './renderer';

export { default as createLibrary } from './library';

export const createLibraryFromState = async (element, state) => {
  const piling = createPilingJs(element);
  await piling.importState(state);
  return piling;
};

export default createPilingJs;
