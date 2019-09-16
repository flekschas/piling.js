import { interpolateMagma } from 'd3-scale-chromatic';

import createPileMe, { createMatrixRenderer } from '../src';

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
const pileMe = createPileMe(document.getElementById('demo'));

pileMe.set('renderer', matrixRenderer);
pileMe.set('items', peaks);
pileMe.set('grid', [10]);
