import * as d3 from 'd3';
import createPilingJs from '../src/library';
import {
  createImageRenderer,
  createRepresentativeRenderer
} from '../src/renderer';
import { createRepresentativeAggregator } from '../src/aggregator';

const createTimeSeriesPiles = async (element, darkMode) => {
  const response = await fetch('data/us-daily-precipitation.json');

  // const response = await fetch('data/cube.json');
  // const response = await fetch('data/last-knit.json');
  // const response = await fetch('data/the-cat.json');

  const data = await response.json();

  const imageRenderer = createImageRenderer();

  const { width, height } = element.getBoundingClientRect();

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
          }
        }
      ]
    }
  ];

  const getMedianItemId = items => {
    const sortedItemIds = items.map(itemId => +itemId).sort();
    return sortedItemIds[Math.floor(sortedItemIds.length / 2)];
  };

  let cameraScale = 1;

  const representativeRenderer = createRepresentativeRenderer(imageRenderer, {
    backgroundColor: 0xffffff
  });

  const representativeAggregator = createRepresentativeAggregator(1, {
    valueGetter: item => item.umap_gray
  });

  const brightnessMod = darkMode ? -1 : 1;

  const piling = createPilingJs(element, {
    darkMode,
    renderer: imageRenderer,
    coverRenderer: representativeRenderer,
    coverAggregator: representativeAggregator,
    items: data,
    itemSize: 64,
    pileCoverScale: 0.9,
    pileBorderColor: pile => colorMap(getMedianItemId(pile.items) / n),
    pileBorderSize: pile => 1 + Math.log(pile.items.length),
    pileItemOffset: () => [Math.random() * 20 - 10, Math.random() * 20 - 10],
    pileItemRotation: () => Math.random() * 20 - 10,
    pileItemBrightness: (item, i, pile) =>
      pile.items.length > 1
        ? (0.25 + Math.max(0.25, i * 0.001)) * brightnessMod
        : 0,
    pileScale: () =>
      cameraScale >= 1 ? 1 + (cameraScale - 1) / 2 : 1 - (1 - cameraScale) / 2
  });

  piling.arrangeBy('uv', pile => data[getMedianItemId(pile.items)].umap_gray, {
    onPile: true
  });

  let transformData = [];

  let lineGroup = drawPileConnections('umap_gray');

  piling.subscribe('zoom', camera => {
    transformData = [];
    cameraScale = camera.scaling;
    lineGroup.attr(
      'transform',
      `translate(${camera.translation[0]}, ${camera.translation[1]}) scale(${cameraScale})`
    );
    transformData.push(...camera.translation, cameraScale);
  });

  return [piling, additionalSidebarOptions];
};

export default createTimeSeriesPiles;
