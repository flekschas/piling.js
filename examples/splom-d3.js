import * as d3 from 'd3';

const createSploms = async () => {
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

  const size = 600;

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
    const svg = d3
      .select('#splom-d3')
      .append('svg')
      .attr('viewBox', `0 0 ${size} ${size}`)
      .attr('width', size)
      .attr('height', size);

    const xAxis = svg
      .append('g')
      .attr('transform', `translate(0, ${padding / 2})`);

    xAxis
      .call(
        d3
          .axisBottom(xPos[i])
          .ticks(6)
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
          .ticks(6)
          .tickSize(padding - size)
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#666'))
      .call(g =>
        g
          .selectAll('.tick text')
          .attr('fill', '#ccc')
          // .attr('font-size', 'smaller')
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
      .attr('r', 4)
      .attr('fill-opacity', 0.7)
      .attr('fill', d => zPos(d['Country Name']))
      .on('mouseover', function() {
        d3.select(this)
          .attr('r', 10)
          .attr('fill-opacity', 1)
          .append('title')
          .text(d =>
            [
              `fertility rate: ${d[fertilityRateColumns[i]]}`,
              `life expectancy: ${d[lifeExpectancyColumns[i]]}`
            ].join('\n')
          );
      })
      .on('click', function() {
        d3.select(this).attr('fill', 'yellow');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('r', 4)
          .attr('fill-opacity', 0.7)
          .attr('fill', d => zPos(d['Country Name']));
      });

    return svg.node();
  };

  for (let i = 0; i < columns; i++) {
    createSplom(i);
  }
};

export default createSploms;
