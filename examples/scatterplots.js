import createPilingJs from '../src/library';
import createScatterplotRenderer from './scatterplot-renderer';
import createScatterplotCoverAggregator from './scatterplot-cover-aggregator';

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

  const scatterplotRenderer = createScatterplotRenderer();
  const coverAggregator = createScatterplotCoverAggregator();

  const piling = createPilingJs(element, {
    darkMode: true,
    renderer: scatterplotRenderer.renderer,
    coverAggregator,
    aggregateRenderer: scatterplotRenderer.renderer,
    items,
    columns: Object.keys(data).length,
    cellPadding: 25,
    pileItemOffset: [0, 0],
    pileVisibilityItems: pile => pile.items.length === 1,
    pileScale: pile => 1 + Math.min((pile.items.length - 1) * 0.05, 0.5)
  });

  piling.arrangeByOnce('data', 'year');

  return piling;
};

export default createScatterplotPiles;
