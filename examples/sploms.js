import * as d3 from 'd3';

import createPilingJs from '../src/library';
import { createSvgRenderer } from '../src/renderer';

const createSplomPiles = async element => {
  const svgRenderer = createSvgRenderer({ width: 600, height: 600 });

  const fertilityRateData = d3.csvParse(
    await fetch('data/fertility-rate.csv').then(body => body.text()),
    d3.autoType
  );

  const fertilityRateColumns = fertilityRateData.columns.filter(
    column => column !== 'Country Name' && column !== 'Country Code'
  );

  const lifeExpectancyData = d3.csvParse(
    await fetch('data/life-expectancy.csv').then(body => body.text()),
    d3.autoType
  );

  const lifeExpectancyColumns = lifeExpectancyData.columns.filter(
    column => column !== 'Country Name' && column !== 'Country Code'
  );

  const columns = fertilityRateColumns.length;

  const padding = 20;

  const size = 100;

  const xPos = fertilityRateColumns.map(column =>
    d3
      .scaleLinear()
      .domain(d3.extent(fertilityRateData, d => d[column]))
      .rangeRound([padding / 2, size - padding / 2])
  );

  const yPos = lifeExpectancyColumns.map(column =>
    d3
      .scaleLinear()
      .domain(d3.extent(lifeExpectancyData, d => d[column]))
      .rangeRound([size - padding / 2, padding / 2])
  );

  const zPos = d3
    .scaleOrdinal()
    .domain(fertilityRateData.map(d => d['Country Name']))
    .range(d3.schemeDark2);

  const createSplom = i => {
    const svg = d3.create('svg').attr('viewBox', `0 0 ${size} ${size}`);

    const xAxis = svg
      .append('g')
      .attr('transform', `translate(0, ${padding / 2})`);

    xAxis
      .call(
        d3
          .axisBottom(xPos[i])
          .ticks(3)
          .tickSize(size - padding)
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#666'))
      .call(g => g.selectAll('.tick text').attr('fill', '#ccc'));

    const yAxis = svg
      .append('g')
      .attr('transform', `translate(${padding / 2}, 0)`);

    yAxis
      .call(
        d3
          .axisLeft(yPos[i])
          .ticks(4)
          .tickSize(padding - size)
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#666'))
      .call(g =>
        g
          .selectAll('.tick text')
          .attr('fill', '#ccc')
          .attr('font-size', 'smaller')
          .attr('writing-mode', 'vertical-lr')
          .attr('x', -6)
          .attr('dy', 8)
      );

    const cell = svg.append('g');

    cell
      .append('rect')
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('x', padding / 2 + 0.5)
      .attr('y', padding / 2 + 0.5)
      .attr('width', size - padding)
      .attr('height', size - padding);

    const circle = cell
      .selectAll('circle')
      .data(fertilityRateData)
      .join('circle')
      .attr('cx', d => xPos[i](d[fertilityRateColumns[i]]))
      .data(lifeExpectancyData)
      .join('circle')
      .attr('cy', d => yPos[i](d[lifeExpectancyColumns[i]]));

    circle
      .attr('r', 1.5)
      .attr('fill-opacity', 0.7)
      .attr('fill', d => zPos(d['Country Name']));

    return svg.node();
  };

  const data = new Array(columns)
    .fill(0)
    .map((d, i) => ({ src: createSplom(i) }));

  const piling = createPilingJs(element, {
    renderer: svgRenderer,
    items: data,
    columns: 6,
    pileItemAlignment: 'overlap'
  });

  return piling;
};

export default createSplomPiles;
