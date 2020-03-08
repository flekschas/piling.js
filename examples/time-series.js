import * as d3 from 'd3';
import createPilingJs from '../src/library';
import { createImageRenderer } from '../src/renderer';

const createTimeSeriesPiles = async element => {
  const response = await fetch('data/us-daily-precipitation.json');
  const data = await response.json();

  const imageRenderer = createImageRenderer();

  const { width, height } = element.getBoundingClientRect();

  const drawPileConnections = prop => {
    d3.select('#connection').remove();

    const svg = d3
      .select(element)
      .append('svg')
      .attr('id', 'connection')
      .attr('viewBox', `0 0 ${width} ${height}`);

    const linesBetweenFrames = data.map((frame, index) =>
      index === data.length - 1 ? [frame] : [frame, data[index + 1]]
    );

    const line = d3
      .line()
      .x(d => d[prop][0] * width)
      .y(d => d[prop][1] * height);

    const gradient = d3.interpolate('white', 'red');

    const numOfLines = linesBetweenFrames.length;

    linesBetweenFrames.forEach((lineData, index) => {
      svg
        .append('path')
        .attr('d', line(lineData))
        .attr('stroke', gradient(index / numOfLines))
        .attr('stroke-width', 3);
    });
  };

  const additionalSidebarOptions = [
    {
      id: 'positionby',
      title: 'Position By',
      fields: [
        {
          name: 'algorithm',
          dtype: 'string',
          defaultValue: 'umap_gray',
          values: [
            'umap_gray',
            'umap_hsl',
            'tsne_gray',
            'tsne_hsl',
            'mds_gray',
            'mds_hsl'
          ],
          setter: values => {
            piling.arrangeBy('uv', pile => data[pile.items[0]][values]);
            drawPileConnections(values);
          }
        }
      ]
    }
  ];

  const piling = createPilingJs(element, {
    renderer: imageRenderer,
    items: data,
    itemSize: 32,
    darkMode: true
  });

  piling.arrangeBy('uv', pile => data[pile.items[0]].umap_gray);

  drawPileConnections('umap_gray');

  return [piling, additionalSidebarOptions];
};

export default createTimeSeriesPiles;
