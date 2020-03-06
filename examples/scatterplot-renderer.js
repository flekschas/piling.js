import { aggregate, unique } from '@flekschas/utils';
import * as d3 from 'd3';
import { createSvgRenderer } from '../src/renderer';

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 600;
const DEFAULT_PADDING = 120;
const DEFAULT_DOTSIZE_RANGE = [6, 18];
const DEFAULT_COLOR_RANGE = [
  '#e05aa9',
  '#e0722b',
  '#e0a638',
  '#e0d42c',
  '#62d9a5',
  '#48a5ff',
  '#ae77f5'
];
const DEFAULT_LINE_COLOR = '#333';
const DEFAULT_TICK_LABEL_COLOR = '#666';
const DEFAULT_TEXT_COLOR = '#fff';
const DEFAULT_OPACITY = 0.7;

const regionProperties = {
  'North America': { abbr: 'NA', index: 0 },
  'Latin America & Caribbean': { abbr: 'LA&C', index: 1 },
  'Europe & Central Asia': { abbr: 'E&CA', index: 2 },
  'Middle East & North Africa': { abbr: 'ME&NA', index: 3 },
  'Sub-Saharan Africa': { abbr: 'SSA', index: 4 },
  'South Asia': { abbr: 'SA', index: 5 },
  'East Asia & Pacific': { abbr: 'EA&P', index: 6 }
};

const createScatterplotRenderer = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  padding = DEFAULT_PADDING,
  x: xProp = 'fertilityRate',
  y: yProp = 'lifeExpectancy',
  size: rProp = 'population',
  color: colorProp = 'region'
} = {}) => {
  const svgRenderer = createSvgRenderer({ width, height });

  const createXScale = domain =>
    d3
      .scaleLinear()
      .domain(domain)
      .rangeRound([padding / 2, width - padding / 2]);

  const createYScale = domain =>
    d3
      .scaleLinear()
      .domain(domain)
      .rangeRound([height - padding / 2, padding / 2]);

  const createSizeScale = domain =>
    d3
      .scaleLinear()
      .domain(domain)
      .range(DEFAULT_DOTSIZE_RANGE);

  let colorMap;

  const createColorMap = domain =>
    d3
      .scaleOrdinal()
      .domain(domain)
      .range(DEFAULT_COLOR_RANGE);

  const createXAxis = xScale => axis =>
    axis
      .attr('transform', `translate(0, ${padding / 2})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(4)
          .tickSize(width - padding)
      )
      .call(g => g.select('.domain').remove())
      .call(g =>
        g
          .selectAll('.tick line')
          .attr('stroke', DEFAULT_LINE_COLOR)
          .attr('stroke-dasharray', '1 2')
          .attr('stroke-width', 3)
      )
      .call(g =>
        g
          .selectAll('.tick text')
          .attr('fill', DEFAULT_TICK_LABEL_COLOR)
          .attr('font-size', '42px')
      );

  const createYAxis = yScale => axis =>
    axis
      .attr('transform', `translate(${padding / 2}, 0)`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(3)
          .tickSize(padding - height)
      )
      .call(g => g.select('.domain').remove())
      .call(g =>
        g
          .selectAll('.tick line')
          .attr('stroke', DEFAULT_LINE_COLOR)
          .attr('stroke-dasharray', '1 2')
          .attr('stroke-width', 3)
      )
      .call(g =>
        g
          .selectAll('.tick text')
          .attr('fill', DEFAULT_TICK_LABEL_COLOR)
          .attr('font-size', '42px')
          .attr('x', -6)
      );

  const stratifyByCountry = countries =>
    countries.reduce((_countries, country) => {
      if (!_countries[country.countryCode])
        _countries[country.countryCode] = [country];
      else _countries[country.countryCode].push(country);

      return _countries;
    }, {});

  const renderScatterplot = ({
    data,
    xAxis,
    xScale,
    yAxis,
    yScale,
    sizeScale
  }) => {
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`);

    const regions = unique(data, d => d.region);

    regions.sort(
      (a, b) => regionProperties[a].index - regionProperties[b].index
    );

    const regionFontSize = 48 - regions.length * 3.5;

    svg
      .selectAll('#region-text')
      .data(regions)
      .join('text')
      .attr('x', (d, i) => (width / (regions.length * 2)) * (i * 2 + 1))
      .attr('y', 42)
      .attr('fill', d => colorMap(d))
      .attr('font-size', `${regionFontSize}px`)
      .attr('font-family', 'sans-serif')
      .attr('text-anchor', 'middle')
      .text(d => {
        if (regions.length > 1) {
          return regionProperties[d].abbr;
        }
        return d;
      });

    svg
      .selectAll('#year-text')
      .data(years.length > 1 ? [years.join(' - ')] : years)
      .join('text')
      .attr('x', width - 24)
      .attr('y', height / 2 + 20)
      .attr('fill', DEFAULT_TEXT_COLOR)
      .attr('font-size', '48px')
      .attr('font-family', 'sans-serif')
      .attr('writing-mode', 'vertical-lr')
      .attr('text-anchor', 'middle')
      .text(d => d);

    svg.append('g').call(xAxis);

    svg.append('g').call(yAxis);

    const cell = svg.append('g');

    cell
      .append('rect')
      .attr('fill', 'none')
      .attr('stroke', DEFAULT_LINE_COLOR)
      .attr('stroke-width', 3)
      .attr('x', padding / 2)
      .attr('y', padding / 2)
      .attr('width', width - padding)
      .attr('height', height - padding);

    const getColorGradient = color => {
      const gradient = d3.interpolate('black', color);
      const beginColor = gradient(0.3);
      return d3.interpolate(beginColor, color);
    };

    const stratifiedCountries = stratifyByCountry(data);

    Object.values(stratifiedCountries).forEach(country =>
      country.sort((a, b) => a.year - b.year)
    );

    Object.values(stratifiedCountries)
      // We only draw lines between multiple years
      .filter(_years => _years.length > 1)
      .forEach(country => {
        const linesBetweenYears = country.map((countryData, index) =>
          index === country.length - 1
            ? [countryData]
            : [countryData, country[index + 1]]
        );

        const line = d3
          .line()
          .curve(d3.curveCatmullRom)
          .x(d => xScale(d[xProp]))
          .y(d => yScale(d[yProp]));

        const colorGradient = getColorGradient(colorMap(country[0][colorProp]));

        const getColor = (index, length) => colorGradient(index / length);

        const numOfYears = country.length;

        linesBetweenYears.forEach((lineData, index) => {
          cell
            .append('path')
            .attr('d', line(lineData))
            .attr('stroke', getColor(index + 1, numOfYears))
            .attr('stroke-width', 6)
            .attr('stroke-opacity', DEFAULT_OPACITY);
        });
      });

    Object.values(stratifiedCountries).forEach(country => {
      const colorGradient = getColorGradient(colorMap(country[0][colorProp]));

      const getColor = (index, length) => colorGradient(index / length);

      const numOfYears = country.length;

      country.forEach((countryOfYear, index) => {
        cell
          .append('circle')
          .attr('cx', xScale(countryOfYear[xProp]))
          .attr('cy', yScale(countryOfYear[yProp]))
          .attr('r', sizeScale(countryOfYear[rProp]))
          .attr('stroke', 'black')
          .attr('stroke-width', 3)
          .attr('fill', getColor(index + 1, numOfYears))
          .attr('fill-opacity', DEFAULT_OPACITY);
      });
    });

    return svg.node();
  };

  let isInit = false;

  let xScale;
  let yScale;
  let sizeScale;
  let xAxis;
  let yAxis;

  let years;

  const init = sources => {
    const getDomain = prop => {
      const domain = sources
        .reduce((newDomain, source) => {
          const tmp = source.map(countryData => countryData[prop]);
          return [...newDomain, ...tmp];
        }, [])
        .filter(d => d !== null);

      const min = Math.min(...domain);
      const max = Math.max(...domain);

      return [min - (max - min) * 0.1, max + (max - min) * 0.1];
    };

    const colorDomain = sources.map(source => source[0][colorProp]);
    colorMap = createColorMap(colorDomain);

    const xDomain = getDomain(xProp);
    const yDomain = getDomain(yProp);
    const sizeDomain = getDomain(rProp);
    xScale = createXScale(xDomain);
    yScale = createYScale(yDomain);
    sizeScale = createSizeScale(sizeDomain);
    xAxis = createXAxis(xScale);
    yAxis = createYAxis(yScale);

    isInit = true;
  };

  const renderer = async sources => {
    if (!isInit) init(sources);

    const svgSources = sources.map(source => {
      const data = source.filter(
        country => country[xProp] !== null && country[yProp] !== null
      );

      years = unique(
        aggregate(data, [Math.min, Math.max], [Infinity, -Infinity], {
          getter: d => d.year
        })
      );

      return renderScatterplot({
        data,
        xAxis,
        xScale,
        yAxis,
        yScale,
        sizeScale
      });
    });

    return svgRenderer(svgSources);
  };

  return {
    renderer,
    get yearDomain() {
      if (years.length === 1) {
        return [...years, ...years];
      }
      return years;
    }
  };
};

export default createScatterplotRenderer;
