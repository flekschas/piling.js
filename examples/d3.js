import { create, range, scaleBand, scaleLinear } from 'd3';

import createPilingJs, { createD3Renderer } from '../src';

const createD3Piles = async (element) => {
  // Setup
  const numItems = 10;
  const numHistBins = 5;
  const itemWidth = 64;
  const itemHeight = 64;

  // Data: Ten items that each have as `src` a list of five random numbers
  const items = Array.from({ length: numItems }, () => ({
    src: Array.from({ length: numHistBins }, () => Math.random()),
  }));

  // Scales
  const x = scaleBand().domain(range(numHistBins)).range([0, 64]).padding(0.1);
  const y = scaleLinear().domain([0, 1]).range([64, 0]);

  // Renderer
  const itemRenderer = createD3Renderer(
    (itemSrc) => {
      const svg = create('svg').attr('viewBox', [0, 0, 64, 64]);

      svg
        .selectAll('rect')
        .data(itemSrc)
        .join('rect')
        .attr('x', (d, i) => x(i))
        .attr('y', (d) => y(d))
        .attr('height', (d) => y(0) - y(d))
        .attr('width', x.bandwidth());

      return svg.node();
    },
    {
      width: itemWidth,
      height: itemHeight,
    }
  );

  const piling = createPilingJs(element, { items, itemRenderer });

  return [piling];
};

export default createD3Piles;
