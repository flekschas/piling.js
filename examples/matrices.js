/* eslint-disable import/no-duplicates */
import { interpolateMagma } from 'd3-scale-chromatic';

import createPileMe from '../src/index';
import createMatrixRenderer from '../src/matrix-renderer';
import createMatrixCoverAggregator from '../src/matrix-cover-aggregator';
import createMatrixPreviewAggregator from '../src/matrix-preview-aggregator';

import peaks from './data/rao-2014-gm12878-chr-22-peaks.json';

const hex2rgba = (hex, alpha = 1) => [
  ...hex.match(/\w\w/g).map(x => parseInt(x, 16) / 256),
  alpha
];
const numColors = 256;
const colorMap = new Array(numColors)
  .fill(0)
  .map((x, i) => hex2rgba(interpolateMagma(i / numColors)));
const matrixRenderer = createMatrixRenderer({ colorMap, shape: [16, 16] });
const matrixCoverAggregator = createMatrixCoverAggregator('mean');
const matrixPreviewAggregator = createMatrixPreviewAggregator('mean');
const pileMe = createPileMe(document.getElementById('demo'));

pileMe.set('renderer', matrixRenderer);
pileMe.set('itemRenderer', matrixRenderer);
pileMe.set('previewRenderer', matrixRenderer);
pileMe.set('aggregateRenderer', matrixRenderer);
pileMe.set('coverAggregator', matrixCoverAggregator);
pileMe.set('previewAggregator', matrixPreviewAggregator);
pileMe.set('items', peaks);
pileMe.set('grid', [10]);
