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

const createColorMap = (interpolator, numColors = 512) => {
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

  const domain = [0, 1];

  const coverRenderer = createMatrixRenderer({
    colorMap: createColorMap('red')
  });

  const matrixCoverAggregator = createMatrixCoverAggregator('mean');
  const matrixPreviewAggregator = createMatrixPreviewAggregator('mean');

  // Build-in dimensionality reducer is using UMAP
  const umap = createUmap();

  const piling = createPilingJs(element);

  let colorMap = createColorMap('purple');

  const matrixRenderer = createMatrixRenderer({ colorMap });
  const matrix1DRenderer = createMatrixRenderer({
    colorMap,
    shape: [1, 16]
  });

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
          setter: newColorMap => {
            colorMap = createColorMap(newColorMap);
            matrixRenderer.setColorMap(colorMap);
            matrix1DRenderer.setColorMap(colorMap);
            piling.render();
          }
        },
        {
          name: 'minValue',
          dtype: 'float',
          min: 0,
          max: 1,
          numSteps: 360,
          defaultValue: 0,
          onInput: true,
          setter: newMinValue => {
            domain[0] = newMinValue;
            matrixRenderer.setDomain(domain);
            matrix1DRenderer.setDomain(domain);
            piling.render();
          }
        },
        {
          name: 'maxValue',
          dtype: 'float',
          min: 0,
          max: 1,
          numSteps: 360,
          defaultValue: 1,
          onInput: true,
          setter: newMaxValue => {
            domain[1] = newMaxValue;
            matrixRenderer.setDomain(domain);
            matrix1DRenderer.setDomain(domain);
            piling.render();
          }
        }
      ]
    }
  ];

  piling.set({
    renderer: matrixRenderer.renderer,
    previewRenderer: matrix1DRenderer.renderer,
    darkMode: true,
    dimensionalityReducer: umap,
    coverRenderer: coverRenderer.renderer,
    coverAggregator: matrixCoverAggregator,
    previewAggregator: matrixPreviewAggregator,
    items: data,
    itemSize: 64,
    pileCellAlignment: 'center',
    pileScale: pile => 1 + Math.min((pile.items.length - 1) * 0.05, 0.5),
    pileItemOrder: itemStates => {
      itemStates.sort((a, b) => a.id - b.id);
      const itemIdsMap = new Map();
      itemStates.forEach((item, index) => {
        itemIdsMap.set(item.id.toString(), index);
      });
      return itemIdsMap;
    }
  });

  // Uncomment the following code to apply UMAP on the raw data
  // piling.arrangeBy(
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
