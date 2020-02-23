/* eslint-disable import/no-duplicates */
import {
  interpolateOrRd,
  interpolateRdPu,
  interpolateRainbow
} from 'd3-scale-chromatic';

import createPilingJs from '../src/library';
import { createMatrixRenderer } from '../src/renderer';
import {
  createMatrixCoverAggregator,
  createMatrixPreviewAggregator
} from '../src/aggregator';
import { createUmap } from '../src/dimensionality-reducer';

const rgbStr2rgba = (rgbStr, alpha = 1) => {
  return [
    ...rgbStr
      .match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      .slice(1, 4)
      .map(x => parseInt(x, 10) / 256),
    alpha
  ];
};

const createColorMap = (interpolator, numColors = 256) => {
  let interpolatorFn;

  switch (interpolator) {
    case 'red':
      interpolatorFn = interpolateOrRd;
      break;

    case 'rainbow':
      interpolatorFn = interpolateRainbow;
      break;

    case 'purple':
    default:
      interpolatorFn = interpolateRdPu;
      break;
  }

  const colorMap = new Array(numColors)
    .fill(0)
    .map((x, i) => rgbStr2rgba(interpolatorFn((numColors - i) / numColors)));

  colorMap[0] = [0, 0, 0, 0]; // Transparent

  return colorMap;
};

const createMatrixPiles = async element => {
  const response = await fetch('data/rao-2014-gm12878-chr-22-peaks.json');
  const data = await response.json();

  const coverRenderer = createMatrixRenderer({
    colorMap: createColorMap('red'),
    shape: [16, 16]
  });

  const matrixCoverAggregator = createMatrixCoverAggregator('mean');
  const matrixPreviewAggregator = createMatrixPreviewAggregator('mean');

  // Build-in dimensionality reducer is using UMAP
  const umap = createUmap();

  const piling = createPilingJs(element);

  const createMatrixAndPreviewRenderer = interpolator => {
    const colorMap = createColorMap(interpolator);

    return {
      renderer: createMatrixRenderer({ colorMap, shape: [16, 16] }),
      previewRenderer: createMatrixRenderer({ colorMap, shape: [16, 1] })
    };
  };

  const additionalSidebarOptions = [
    {
      id: 'rendering',
      title: 'Rendering',
      fields: [
        {
          name: 'colorMap',
          dtype: 'string',
          defaultValue: 'purple',
          values: ['purple', 'rainbow'],
          setter: values => {
            piling.set(createMatrixAndPreviewRenderer(values));
          }
        }
      ]
    }
  ];

  piling.set({
    ...createMatrixAndPreviewRenderer('purple'),
    darkMode: true,
    dimensionalityReducer: umap,
    aggregateRenderer: coverRenderer,
    coverAggregator: matrixCoverAggregator,
    previewAggregator: matrixPreviewAggregator,
    items: data,
    itemSize: 64,
    pileCellAlignment: 'center',
    pileScale: pile => 1 + Math.min((pile.items.length - 1) * 0.05, 0.5)
  });

  // Uncomment the following code to apply UMAP on the raw data
  // pilingJs.arrangeBy(
  //   'data',
  //   {
  //     property: item => item.src.data,
  //     propertyIsVector: true
  //   },
  //   {
  //     forceDimReduction: true
  //   }
  // );

  return [piling, additionalSidebarOptions];
};

export default createMatrixPiles;
