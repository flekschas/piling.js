import * as d3 from 'd3';
import createPilingJs from '../src/library';
import { createImageRenderer } from '../src/renderer';

const createTimeCurvePiles = async element => {
  const svg = await d3
    .xml('data/cloud-curve.svg')
    .then(data => data.documentElement);

  const circle = d3.select(svg).selectAll('.point');

  const width = d3
    .select(svg)
    .select('rect')
    .attr('width');
  const height = d3
    .select(svg)
    .select('rect')
    .attr('height');

  const x = [];
  const y = [];

  // eslint-disable-next-line no-underscore-dangle
  circle._groups[0].forEach(c => {
    const u = c.cx.baseVal.value / width;
    const v = c.cy.baseVal.value / height;

    x.push(u);
    y.push(v);
  });

  const imageRenderer = createImageRenderer();

  const response = await fetch('data/cloud.json');
  const data = await response.json();

  data.forEach((item, i) => {
    item.u = x[i];
    item.v = y[i];
  });

  const piling = createPilingJs(element, {
    renderer: imageRenderer,
    items: data,
    itemSize: 128,
    darkMode: true
  });

  piling.arrangeBy('data', ['u', 'v']);

  return [piling];
};

export default createTimeCurvePiles;
