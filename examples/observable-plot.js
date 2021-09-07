import * as Plot from '@observablehq/plot';

import createPilingJs, { createObservablePlotRenderer } from '../src';

const createObservablePlotPiles = async (element) => {
  // Setup
  const numItems = 10;
  const numHistBins = 5;
  const itemWidth = 256;
  const itemHeight = 256;

  // Data: Ten items that each have as `src` a list of five random numbers
  const items = Array.from({ length: numItems }, () => ({
    src: Array.from({ length: numHistBins }, (_, index) => ({
      index,
      value: Math.random(),
    })),
  }));

  // Renderers
  const itemRenderer = createObservablePlotRenderer(
    Plot,
    // A function that translates `itemSrc` into marks
    (itemSrc) => [Plot.barY(itemSrc, { x: 'index', y: 'value' })],
    // Plot.plot() options
    {
      width: itemWidth,
      height: itemHeight,
    }
  );

  const piling = createPilingJs(element, { items, itemRenderer });

  return [piling];
};

export default createObservablePlotPiles;
