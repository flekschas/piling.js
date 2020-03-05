import createPilingJs from '../src/library';
import createScatterplotRenderer from './scatterplot-renderer';
import createScatterplotCoverAggregator from './scatterplot-cover-aggregator';
import createScatterplotPreviewAggregator from './scatterplot-preview-aggregator';
import createScatterplotPreviewRenderer from './scatterplot-preview-renderer';

const createScatterplotPiles = async element => {
  const response = await fetch('data/worldbank-objects.json');
  const data = await response.json();

  const items = [];

  const regionOrder = [
    'North America',
    'Latin America & Caribbean',
    'Europe & Central Asia',
    'Middle East & North Africa',
    'Sub-Saharan Africa',
    'South Asia',
    'East Asia & Pacific'
  ];

  regionOrder.forEach(region => {
    Object.entries(data[region]).forEach(([year, countries]) => {
      items.push({
        region,
        year: +year,
        src: Object.entries(countries).map(([countryCode, country]) => ({
          region,
          year,
          countryCode,
          ...country
        }))
      });
    });
  });

  const scatterplotRenderer = createScatterplotRenderer({
    width: 600,
    height: 600
  });
  const coverAggregator = createScatterplotCoverAggregator();
  const previewAggregator = createScatterplotPreviewAggregator();
  const previewRenderer = createScatterplotPreviewRenderer({
    width: 20,
    height: 60
  });

  const pileItemOrderFunc = itemStates => {
    itemStates.sort((a, b) => {
      if (a.region === b.region) {
        return a.year - b.year;
      }
      return regionOrder.indexOf(a.region) - regionOrder.indexOf(b.region);
    });

    return itemStates.map(item => item.id.toString());
  };

  const regionPreviewOffset = new Array(7).fill(0);

  const previewItemOffsetFunc = (itemState, itemIndex) => {
    if (itemIndex === 0) regionPreviewOffset.fill(0);

    const regionIndex = regionOrder.indexOf(itemState.region);

    const x = regionPreviewOffset[regionIndex] * 30 + 330;
    const y = 70 * regionIndex - 210;

    regionPreviewOffset[regionIndex] += 1;

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
    pileItemOrder: pileItemOrderFunc,
    previewItemOffset: previewItemOffsetFunc,
    previewSpacing: 6
  });

  piling.arrangeByOnce('data', 'year');

  return piling;
};

export default createScatterplotPiles;
