import * as d3 from 'd3';

import createPilingJs from '../src/library';
import { createSvgRenderer } from '../src/renderer';

const createScatterplotPiles = async element => {
  const svgRenderer = createSvgRenderer({ width: 600, height: 600 });

  const fetchCsv = async fileName =>
    d3.csvParse(await fetch(fileName).then(body => body.text()), d3.autoType);

  const fRData = await fetchCsv('data/fertility-rate.csv');
  const lEData = await fetchCsv('data/life-expectancy.csv');
  const country2continentData = await fetchCsv('data/data.csv');

  const categorizeByContinent = data => {
    const continentData = {
      AS: [],
      AF: [],
      OC: [],
      NA: [],
      SA: [],
      EU: []
    };

    data.forEach(d => {
      const continent = country2continentData[0][d['Country Code']];
      if (continentData[continent]) {
        continentData[continent].push(d);
      }
    });

    return continentData;
  };

  const fertilityRateData = categorizeByContinent(fRData);
  const lifeExpectancyData = categorizeByContinent(lEData);

  const padding = 20;
  const size = 100;

  const createXPos = (xData, column) =>
    d3
      .scaleLinear()
      .domain(d3.extent(xData, d => d[column]))
      .rangeRound([padding / 2, size - padding / 2]);

  const createYPos = (yData, column) =>
    d3
      .scaleLinear()
      .domain(d3.extent(yData, d => d[column]))
      .rangeRound([size - padding / 2, padding / 2]);

  const zPos = d3
    .scaleOrdinal()
    .domain(Object.keys(fertilityRateData))
    .range(d3.schemeDark2);

  const createScatterplot = (year, xData, yData, continent) => {
    const svg = d3.create('svg').attr('viewBox', `0 0 ${size} ${size}`);

    const xPos = createXPos(xData, year);

    const xAxis = svg
      .append('g')
      .attr('transform', `translate(0, ${padding / 2})`);

    xAxis
      .call(
        d3
          .axisBottom(xPos)
          .ticks(3)
          .tickSize(size - padding)
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#444'))
      .call(g => g.selectAll('.tick text').attr('fill', '#aaa'));

    const yPos = createYPos(yData, year);

    const yAxis = svg
      .append('g')
      .attr('transform', `translate(${padding / 2}, 0)`);

    yAxis
      .call(
        d3
          .axisLeft(yPos)
          .ticks(4)
          .tickSize(padding - size)
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#444'))
      .call(g =>
        g
          .selectAll('.tick text')
          .attr('fill', '#aaa')
          .attr('font-size', 'smaller')
          .attr('writing-mode', 'vertical-lr')
          .attr('x', -6)
          .attr('dy', 8)
      );

    const cell = svg.append('g');

    cell
      .append('rect')
      .attr('fill', 'none')
      .attr('stroke', '#aaa')
      .attr('x', padding / 2 + 0.5)
      .attr('y', padding / 2 + 0.5)
      .attr('width', size - padding)
      .attr('height', size - padding);

    const circle = cell
      .selectAll('circle')
      .data(xData)
      .join('circle')
      .attr('cx', d => xPos(d[year]))
      .data(yData)
      .join('circle')
      .attr('cy', d => yPos(d[year]));

    circle
      .attr('r', 1.5)
      .attr('fill-opacity', 0.7)
      .attr('fill', () => zPos(continent));

    return svg.node();
  };

  const items = [];

  const columnsOfYears = fRData.columns.filter(
    column => column !== 'Country Name' && column !== 'Country Code'
  );

  columnsOfYears.forEach(year => {
    Object.entries(fertilityRateData).forEach(([continent, xData]) => {
      const yData = lifeExpectancyData[continent];
      const scatterplot = {};
      scatterplot.src = createScatterplot(year, xData, yData, continent);
      items.push(scatterplot);
    });
  });

  const columns = Object.keys(fertilityRateData).length;

  const piling = createPilingJs(element, {
    renderer: svgRenderer,
    items,
    columns,
    pileItemAlignment: 'overlap'
  });

  return piling;
};

export default createScatterplotPiles;
