/* eslint-disable import/no-duplicates */
import { interpolateOrRd, interpolateRdPu } from 'd3-scale-chromatic';

import createPilingJs from '../src/library';
import { createMatrixRenderer } from '../src/renderer';
import {
  createMatrixCoverAggregator,
  createMatrixPreviewAggregator
} from '../src/aggregator';

const rgbStr2rgba = (rgbStr, alpha = 1) => {
  return [
    ...rgbStr
      .match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      .slice(1, 4)
      .map(x => parseInt(x, 10) / 256),
    alpha
  ];
};

const createMatrixPiles = async element => {
  const response = await fetch('data/rao-2014-gm12878-chr-22-peaks.json');
  const data = await response.json();

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
  const pilingJs = createPilingJs(element);

  pilingJs.set({
    renderer: matrixRenderer,
    previewRenderer,
    aggregateRenderer: coverRenderer,
    coverAggregator: matrixCoverAggregator,
    previewAggregator: matrixPreviewAggregator,
    items: data,
    itemSize: 64,
    pileCellAlignment: 'center',
    pileScale: pile => 1 + Math.min((pile.items.length - 1) * 0.05, 0.5)
  });

  pilingJs.arrangeByOnce('data', ['distanceToDiagonal']);
  return pilingJs;
};

export default createMatrixPiles;
