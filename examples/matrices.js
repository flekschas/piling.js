/* eslint-disable import/no-duplicates */
import { interpolateOrRd, interpolateRdPu } from 'd3-scale-chromatic';

import createPileMe from '../src/index';
import createMatrixRenderer from '../src/matrix-renderer';
import createMatrixCoverAggregator from '../src/matrix-cover-aggregator';
import createMatrixPreviewAggregator from '../src/matrix-preview-aggregator';

import peaks from './data/rao-2014-gm12878-chr-22-peaks.json';

// const hex2rgba = (hex, alpha = 1) => [
//   ...hex.match(/\w\w/g).map(x => parseInt(x, 16) / 256),
//   alpha
// ];

const rgbStr2rgba = (rgbStr, alpha = 1) => {
  return [
    ...rgbStr
      .match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      .slice(1, 4)
      .map(x => parseInt(x, 10) / 256),
    alpha
  ];
};

const numColors = 256;
const colorMap = new Array(numColors)
  .fill(0)
  .map((x, i) => rgbStr2rgba(interpolateRdPu((numColors - i) / numColors)));
colorMap[0] = [0, 0, 0, 0];

const coverColorMap = new Array(numColors)
  .fill(0)
  .map((x, i) => rgbStr2rgba(interpolateOrRd((numColors - i) / numColors)));
const matrixRenderer = createMatrixRenderer({ colorMap, shape: [16, 16] });
const coverRenderer = createMatrixRenderer({
  colorMap: coverColorMap,
  shape: [16, 16]
});

const previewRenderer = createMatrixRenderer({ colorMap, shape: [16, 1] });
const matrixCoverAggregator = createMatrixCoverAggregator('mean');
const matrixPreviewAggregator = createMatrixPreviewAggregator('mean');
const pileMe = createPileMe(document.getElementById('demo'));

pileMe.set('renderer', matrixRenderer);
pileMe.set('itemRenderer', matrixRenderer);
pileMe.set('previewRenderer', previewRenderer);
pileMe.set('aggregateRenderer', coverRenderer);
pileMe.set('coverAggregator', matrixCoverAggregator);
pileMe.set('previewAggregator', matrixPreviewAggregator);
pileMe.set('items', peaks);
pileMe.set('grid', [10]);
// pileMe.set('previewSpacing', 1);
