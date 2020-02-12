import * as d3 from 'd3';

const createSploms = async element => {
  const splomData = d3.csvParse(
    await fetch('data/diabetes.csv').then(body => body.text()),
    d3.autoType
  );

  const columns = splomData.columns.filter(column => column !== 'Outcome');

  const { width } = element.getBoundingClientRect();

  const padding = 20;

  const size = (width - (columns.length + 1) * padding) / columns.length;

  const xPos = columns.map(column =>
    d3
      .scaleLinear()
      .domain(d3.extent(splomData, d => d[column]))
      .rangeRound([padding / 2, size - padding / 2])
  );

  const yPos = xPos.map(x => x.copy().range([size - padding / 2, padding / 2]));

  const zPos = d3
    .scaleOrdinal()
    .domain(splomData.map(d => d.Outcomes))
    .range(d3.schemeDark2);

  const createSplom = i => {
    const row = Math.floor(i / columns.length);
    const col = i % columns.length;

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
          .axisBottom(xPos[col])
          .ticks(3)
          .tickSize(size - padding)
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#666'))
      .call(g => g.selectAll('.tick text').attr('fill', '#fff'));

    const yAxis = svg
      .append('g')
      .attr('transform', `translate(${padding / 2}, 0)`);

    yAxis
      .call(
        d3
          .axisLeft(yPos[row])
          .ticks(3)
          .tickSize(padding - size)
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#666'))
      .call(g =>
        g
          .selectAll('.tick text')
          .attr('fill', '#fff')
          .attr('writing-mode', 'vertical-lr')
          .attr('x', -6)
          .attr('dy', 8)
      );

    const cell = svg.append('g');

    cell
      .append('rect')
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('x', padding / 2 + 0.5)
      .attr('y', padding / 2 + 0.5)
      .attr('width', size - padding)
      .attr('height', size - padding);

    const circle = cell
      .selectAll('circle')
      .data(splomData)
      .join('circle')
      .attr('cx', d => xPos[col](d[columns[col]]))
      .attr('cy', d => yPos[row](d[columns[row]]));

    circle
      .attr('r', 2.5)
      .attr('fill-opacity', 0.7)
      .attr('fill', d => zPos(d.Outcome))
      .on('mouseover', function() {
        d3.select(this)
          .attr('r', 10)
          .attr('fill-opacity', 1)
          .append('title')
          .text(d =>
            [
              `${columns[col]}: ${d[columns[col]]}`,
              `${columns[row]}: ${d[columns[row]]}`
            ].join('\n')
          );
      })
      .on('click', function() {
        d3.select(this).attr('fill', 'yellow');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('r', 2.5)
          .attr('fill-opacity', 0.7)
          .attr('fill', d => zPos(d.Outcome));
      });

    if (row === col) {
      svg
        .append('g')
        .style('font', 'bold 20px sans-serif')
        .append('text')
        .attr('x', padding)
        .attr('y', padding)
        .attr('dy', '.71em')
        .attr('fill', '#fff')
        .text(columns[row]);
    }

    return svg.node();
  };

  for (let i = 0; i < columns.length * columns.length; i++) {
    createSplom(i);
  }
};

export default createSploms;
