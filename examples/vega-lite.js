import * as vega from 'vega/build/vega';
import * as vegaLite from 'vega-lite/build/vega-lite';

import createPilingJs, { createVegaLiteRenderer } from '../src';

const createVegaLitePiles = async (element) => {
  // Setup
  const numItems = 10;
  const numHistBins = 5;
  const itemWidth = 64;
  const itemHeight = 64;

  // Data: Ten items that each have as `src` a list of five random numbers
  const items = Array.from({ length: numItems }, () => ({
    src: Array.from({ length: numHistBins }, (_, index) => ({
      index,
      value: Math.random(),
    })),
  }));

  // Renderers
  const itemRenderer = createVegaLiteRenderer({
    vega,
    vegaLite,
    baseSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: itemWidth,
      height: itemHeight,
      mark: 'bar',
      encoding: {
        x: {
          field: 'index',
          type: 'ordinal',
        },
        y: {
          field: 'value',
          type: 'quantitative',
        },
      },
    },
  });

  const piling = createPilingJs(element, { items, itemRenderer });

  return [piling];
};

export default createVegaLitePiles;
