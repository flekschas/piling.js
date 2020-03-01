import * as d3 from 'd3';

const createSploms = async element => {
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

  const padding = 50;

  const { width } = element.getBoundingClientRect();
  const columns = Object.keys(fertilityRateData).length;

  const size = (width - (columns + 1) * padding) / columns + padding;

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
    const svg = d3
      .select('#splom-d3')
      .append('svg')
      .attr('viewBox', `0 0 ${size} ${size}`)
      .attr('width', size)
      .attr('height', size);

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
      .call(g => g.selectAll('.tick line').attr('stroke', '#666'))
      .call(g => g.selectAll('.tick text').attr('fill', '#ccc'));

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
      .data(xData)
      .join('circle')
      .attr('cx', d => xPos(d[year]))
      .data(yData)
      .join('circle')
      .attr('cy', d => yPos(d[year]));

    circle
      .attr('r', 4)
      .attr('fill-opacity', 0.7)
      .attr('fill', () => zPos(continent))
      .on('mouseover', function() {
        d3.select(this)
          .attr('r', 10)
          .attr('fill-opacity', 1)
          .append('title')
          .text(d =>
            [`fertility rate: ${d[year]}`, `life expectancy: ${d[year]}`].join(
              '\n'
            )
          );
      })
      .on('click', function() {
        d3.select(this).attr('fill', 'yellow');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('r', 4)
          .attr('fill-opacity', 0.7)
          .attr('fill', () => zPos(continent));
      });

    return svg.node();
  };

  const columnsOfYears = fRData.columns.filter(
    column => column !== 'Country Name' && column !== 'Country Code'
  );

  columnsOfYears.forEach(year => {
    Object.entries(fertilityRateData).forEach(([continent, xData]) => {
      const yData = lifeExpectancyData[continent];
      createScatterplot(year, xData, yData, continent);
    });
  });
};

export default createSploms;
