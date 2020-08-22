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

export const createPilingJsFromState = (element, state) =>
  new Promise((resolve) => {
    const piling = createPilingJs(element);
    piling.subscribe(async () => {
      await piling.importState(state);
      resolve(piling);
    }, 1);
  });

export default createPilingJs;
