import * as d3 from 'd3';
import createPilingJs from '../src/library';
import { createImageRenderer } from '../src/renderer';

const createTimeSeriesPiles = async (element, darkMode) => {
  const response = await fetch('data/us-daily-precipitation-remote.json');

  // const response = await fetch('data/cube.json');
  // const response = await fetch('data/last-knit.json');
  // const response = await fetch('data/the-cat.json');

  const data = await response.json();

  const imageRenderer = createImageRenderer();

  let width = element.getBoundingClientRect().width;
  let height = element.getBoundingClientRect().height;

  const n = data.length;
  const colorMap = darkMode
    ? d3.interpolateRgbBasis(['#444', 'firebrick', 'orange', 'white'])
    : d3.interpolateRgbBasis(['lightgray', 'orange', 'black']);

  const drawPileConnections = prop => {
    d3.select('#connection').remove();

    const svg = d3
      .select(element)
      .append('svg')
      .attr('id', 'connection')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height);

    const linesBetweenFrames = data.map((frame, index) =>
      index === data.length - 1 ? [frame] : [frame, data[index + 1]]
    );

    const line = d3
      .line()
      .x(d => d[prop][0] * width)
      .y(d => d[prop][1] * height);

    const g = svg.append('g');

    linesBetweenFrames.forEach((lineData, index) => {
      g.append('path')
        .attr('d', line(lineData))
        .attr('stroke', colorMap(index / n))
        .attr('stroke-width', 3);
    });

    if (transformData.length) {
      g.attr(
        'transform',
        `translate(${transformData[0]}, ${transformData[1]}) scale(${transformData[2]})`
      );
    }

    return g;
  };

  let embedding = 'umap_gray';

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
            piling.arrangeBy('uv', pile => data[pile.items[0]][values], {
              onPile: true
            });
            lineGroup = drawPileConnections(values);
            embedding = values;
          }
        }
      ]
    }
  ];

  const getMedianItemId = items => {
    const sortedItemIds = items.map(itemId => +itemId).sort();
    return sortedItemIds[Math.floor(sortedItemIds.length / 2)];
  };

  const isLast = (i, arr) => arr.length - 1 !== i;

  const viewSpecification = {
    // Item rendering
    items: data,
    renderer: imageRenderer,

    // Global properties
    darkMode,
    itemSize: 96,
    zoomScale: cameraScale =>
      cameraScale >= 1 ? 1 + (cameraScale - 1) / 2 : 1 - (1 - cameraScale) / 2,

    // Pile-specific properties
    pileBackgroundColor: 'rgba(0, 0, 0, 1)',
    pileBorderColor: pile => colorMap(getMedianItemId(pile.items) / n),
    pileBorderSize: pile => 1 + Math.log(pile.items.length),

    // Item-specific properties
    pileItemOffset: (item, i, pile) => [
      isLast(i, pile.items) * (Math.random() * 24 - 12),
      isLast(i, pile.items) * (Math.random() * 24 - 12)
    ],
    pileItemRotation: (item, i, pile) =>
      isLast(i, pile.items) * (Math.random() * 24 - 12)
  };

  const piling = createPilingJs(element, viewSpecification);

  piling.arrangeBy('uv', pile => data[getMedianItemId(pile.items)].umap_gray, {
    onPile: true
  });

  let transformData = [];

  let lineGroup = drawPileConnections('umap_gray');

  piling.subscribe('zoom', camera => {
    transformData = [];
    lineGroup.attr(
      'transform',
      `translate(${camera.translation[0]}, ${camera.translation[1]}) scale(${camera.scaling})`
    );
    transformData.push(...camera.translation, camera.scaling);
  });

  piling.subscribe('resize', size => {
    width = size.width;
    height = size.height;
    lineGroup = drawPileConnections(embedding);
  });
  return [piling, additionalSidebarOptions];
};

export default createTimeSeriesPiles;
