import * as d3 from 'd3';
import createPilingJs from '../src/library';
import createScatterplotRenderer from './scatterplot-renderer';
import createScatterplotCoverAggregator from './scatterplot-cover-aggregator';
import createScatterplotPreviewAggregator from './scatterplot-preview-aggregator';
import createScatterplotPreviewRenderer from './scatterplot-preview-renderer';

const createScatterplotPiles = async element => {
  const response = await fetch('data/worldbank-objects.json');
  const data = await response.json();

  const items = [];

  const regionOrderIndex = {
    'North America': 0,
    'Latin America & Caribbean': 1,
    'Europe & Central Asia': 2,
    'Middle East & North Africa': 3,
    'Sub-Saharan Africa': 4,
    'South Asia': 5,
    'East Asia & Pacific': 6
  };

  Object.keys(regionOrderIndex).forEach(region => {
    Object.entries(data[region]).forEach(([year, countries]) => {
      items.push({
        region,
        year: +year,
        src: Object.entries(countries).map(([countryCode, country]) => ({
          region,
          year: +year,
          countryCode,
          ...country
        }))
      });
    });
  });

  const width = 600;
  const height = 600;
  const padding = 120;
  const previewSize = 20;

  const scatterplotRenderer = createScatterplotRenderer({
    width,
    height,
    padding
  });
  const coverAggregator = createScatterplotCoverAggregator();
  const previewAggregator = createScatterplotPreviewAggregator();
  const previewRenderer = createScatterplotPreviewRenderer({
    width: previewSize,
    height: previewSize
  });

  const pileItemOrder = itemStates => {
    itemStates.sort((a, b) => {
      if (a.region === b.region) {
        return a.year - b.year;
      }
      return regionOrderIndex[a.region] - regionOrderIndex[b.region];
    });
    const itemIdsMap = new Map();
    itemStates.forEach((item, index) => {
      itemIdsMap.set(item.id.toString(), index);
    });
    return itemIdsMap;
  };

  const previewItemYOffset = d3.scaleLinear();

  let beginYear;

  const previewItemOffset = (itemState, itemIndex) => {
    if (itemIndex === 0) {
      beginYear = scatterplotRenderer.yearDomain[0];
      const years = scatterplotRenderer.yearDomain[1] - beginYear + 1;
      const rangeMin = Math.max(0, height / 2 - years * 12.5);
      const rangeMax = Math.min(height, height / 2 + years * 12.5);
      previewItemYOffset
        .domain(scatterplotRenderer.yearDomain)
        .rangeRound([rangeMin, rangeMax]);
    }
    const x = regionOrderIndex[itemState.region] * 25 + width + previewSize;

    const y = previewItemYOffset(itemState.year);

    return [x, y];
  };

  const piling = createPilingJs(element, {
    darkMode: true,
    renderer: scatterplotRenderer.renderer,
    coverAggregator,
    aggregateRenderer: scatterplotRenderer.renderer,
    previewAggregator,
    previewRenderer: previewRenderer.renderer,
    items,
    columns: Object.keys(data).length,
    cellPadding: 25,
    pileScale: pile => 1 + Math.min((pile.items.length - 1) * 0.1, 0.5),
    pileItemOrder,
    previewItemOffset,
    previewSpacing: 4
  });

  piling.arrangeByOnce('data', 'year');

  return piling;
};

export default createScatterplotPiles;
