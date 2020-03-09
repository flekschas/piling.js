import { aggregate, unique } from '@flekschas/utils';
import * as d3 from 'd3';
import { createSvgRenderer } from '../src/renderer';

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 480;
const DEFAULT_PADDING_VERTICAL = 60;
const DEFAULT_PADDING_HORIZONTAL = 140;
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
  'North America': { abbr: 'NA', abbr2: 'NA', index: 0 },
  'Latin America & Caribbean': { abbr: 'LAC', abbr2: 'LA', index: 1 },
  'Europe & Central Asia': { abbr: 'ECA', abbr2: 'EA', index: 2 },
  'Middle East & North Africa': { abbr: 'MENA', abbr2: 'ME', index: 3 },
  'Sub-Saharan Africa': { abbr: 'SSA', abbr2: 'A', index: 4 },
  'South Asia': { abbr: 'SA', abbr2: 'SA', index: 5 },
  'East Asia & Pacific': { abbr: 'EAP', abbr2: 'EA', index: 6 }
};

const createScatterplotRenderer = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  paddingV = DEFAULT_PADDING_VERTICAL,
  paddingH = DEFAULT_PADDING_HORIZONTAL,
  x: xProp = 'fertilityRate',
  y: yProp = 'lifeExpectancy',
  size: rProp = 'population',
  color: colorProp = 'region'
} = {}) => {
  const svgRenderer = createSvgRenderer({
    width: width + paddingH * 2,
    height: height + paddingV * 2
  });

  const createXScale = domain =>
    d3
      .scaleLinear()
      .domain(domain)
      .rangeRound([paddingH, width + paddingH]);

  const createYScale = domain =>
    d3
      .scaleLinear()
      .domain(domain)
      .rangeRound([height, paddingV]);

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
      .attr('transform', `translate(0, ${paddingV})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(4)
          .tickSize(width)
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
      .attr('transform', `translate(${paddingH}, 0)`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(3)
          .tickSize(-height)
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
    const svg = d3
      .create('svg')
      .attr('viewBox', `0 0 ${width + paddingH * 2} ${height + paddingV * 2}`);

    const regions = unique(data, d => d.region);

    regions.sort(
      (a, b) => regionProperties[a].index - regionProperties[b].index
    );

    const regionLabel = svg
      .append('foreignObject')
      .attr('x', paddingH)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', 48)
      .append('xhtml:div')
      .join('foreignObject')
      .style('width', '100%')
      .style('height', '100%')
      .style('overflow', 'hidden')
      .style('text-overflow', 'ellipsis')
      .style('white-space', 'nowrap')
      .style('font-size', '42px')
      .style('font-family', 'sans-serif');

    regionLabel
      .selectAll('span')
      .data(regions)
      .join('xhtml:span')
      .style('color', d => colorMap(d))
      .style('padding-right', '12px')
      .html(d => {
        if (regions.length > 3) return regionProperties[d].abbr2;
        if (regions.length > 1) return regionProperties[d].abbr;
        return d;
      });

    svg
      .selectAll('#year-text')
      .data(years)
      .join('text')
      .attr('x', width + (paddingH * 3) / 2)
      .attr('y', (d, i) => (i === 0 ? 42 : height + paddingV + 40))
      .attr('fill', DEFAULT_TEXT_COLOR)
      .attr('font-size', '42px')
      .attr('font-family', 'sans-serif')
      .attr('text-anchor', 'middle')
      .text(d => d);

    svg
      .append('rect')
      .attr('fill', '#000000')
      .attr('x', paddingH)
      .attr('y', paddingV)
      .attr('width', width)
      .attr('height', height);

    svg.append('g').call(xAxis);

    svg.append('g').call(yAxis);

    const cell = svg.append('g');

    cell
      .append('rect')
      .attr('fill', 'none')
      .attr('stroke', DEFAULT_LINE_COLOR)
      .attr('stroke-width', 3)
      .attr('x', paddingH)
      .attr('y', paddingV)
      .attr('width', width)
      .attr('height', height);

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
      if (source[0].src) {
        // eslint-disable-next-line no-param-reassign
        source = source.flatMap(itemState => itemState.src);
      }

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
