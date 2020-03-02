import * as d3 from 'd3';
import { createSvgRenderer } from '../src/renderer';

const DEFAULT_PADDING = 20;
const DEFAULT_SIZE = 100;
const DEFAULT_DOTSIZE_RANGE = [1.5, 4];
const DEFAULT_COLOR_RANGE = d3.schemeDark2;
const DEFAULT_LINE_COLOR = '#333';
const DEFAULT_TEXT_COLOR = '#aaa';

const createScatterplotRenderer = ({
  width = 600,
  height = 600,
  x = 'fertilityRate',
  y = 'lifeExpectancy',
  size: dotSize = 'population',
  color: colorProperty = 'region'
} = {}) => {
  const svgRenderer = createSvgRenderer({ width, height });

  const createXPos = domain =>
    d3
      .scaleLinear()
      .domain(domain)
      .rangeRound([DEFAULT_PADDING / 2, DEFAULT_SIZE - DEFAULT_PADDING / 2]);

  const createYPos = domain =>
    d3
      .scaleLinear()
      .domain(domain)
      .rangeRound([DEFAULT_SIZE - DEFAULT_PADDING / 2, DEFAULT_PADDING / 2]);

  const createZPos = domain =>
    d3
      .scaleLinear()
      .domain(domain)
      .range(DEFAULT_DOTSIZE_RANGE);

  const createColorScale = domain =>
    d3
      .scaleOrdinal()
      .domain(domain)
      .range(DEFAULT_COLOR_RANGE);

  const createScatterplot = (xDomain, yDomain, sizeDomain, color) => {
    const svg = d3
      .create('svg')
      .attr('viewBox', `0 0 ${DEFAULT_SIZE} ${DEFAULT_SIZE}`);

    const xPos = createXPos([Math.min(...xDomain), Math.max(...xDomain)]);

    const xAxis = svg
      .append('g')
      .attr('transform', `translate(0, ${DEFAULT_PADDING / 2})`);

    xAxis
      .call(
        d3
          .axisBottom(xPos)
          .ticks(3)
          .tickSize(DEFAULT_SIZE - DEFAULT_PADDING)
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', DEFAULT_LINE_COLOR))
      .call(g =>
        g
          .selectAll('.tick text')
          .attr('fill', DEFAULT_TEXT_COLOR)
          .attr('font-size', 'smaller')
      );

    const yPos = createYPos([Math.min(...yDomain), Math.max(...yDomain)]);

    const yAxis = svg
      .append('g')
      .attr('transform', `translate(${DEFAULT_PADDING / 2}, 0)`);

    yAxis
      .call(
        d3
          .axisLeft(yPos)
          .ticks(3)
          .tickSize(DEFAULT_PADDING - DEFAULT_SIZE)
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', DEFAULT_LINE_COLOR))
      .call(g =>
        g
          .selectAll('.tick text')
          .attr('fill', DEFAULT_TEXT_COLOR)
          .attr('font-size', 'smaller')
          .attr('writing-mode', 'vertical-lr')
          .attr('x', -6)
          .attr('dy', 12)
      );

    const cell = svg.append('g');

    cell
      .append('rect')
      .attr('fill', 'none')
      .attr('stroke', DEFAULT_TEXT_COLOR)
      .attr('x', DEFAULT_PADDING / 2 + 0.5)
      .attr('y', DEFAULT_PADDING / 2 + 0.5)
      .attr('width', DEFAULT_SIZE - DEFAULT_PADDING)
      .attr('height', DEFAULT_SIZE - DEFAULT_PADDING);

    const zPos = createZPos([Math.min(...sizeDomain), Math.max(...sizeDomain)]);

    const circle = cell
      .selectAll('circle')
      .data(xDomain)
      .join('circle')
      .attr('cx', d => xPos(d))
      .data(yDomain)
      .join('circle')
      .attr('cy', d => yPos(d))
      .data(sizeDomain)
      .join('circle')
      .attr('r', d => zPos(d));

    circle.attr('fill-opacity', 0.7).attr('fill', color);

    return svg.node();
  };

  const renderer = async sources => {
    const colorDomain = sources.map(source => source[0][colorProperty]);
    const colorScale = createColorScale(colorDomain);

    const svgSources = sources.map(source => {
      const xDomain = source.map(countryData => countryData[x]);
      const yDomain = source.map(countryData => countryData[y]);
      const sizeDomain = source.map(countryData => countryData[dotSize]);
      const color = colorScale(source[0][colorProperty]);

      return createScatterplot(xDomain, yDomain, sizeDomain, color);
    });

    return svgRenderer(svgSources);
  };

  return {
    renderer
  };
};

export default createScatterplotRenderer;
