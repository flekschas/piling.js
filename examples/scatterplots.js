import createPilingJs from '../src/library';
import createScatterplotRenderer from './scatterplot-renderer';
import createScatterplotCoverAggregator from './scatterplot-cover-aggregator';

const createScatterplotPiles = async element => {
  const response = await fetch('data/worldbank-objects.json');
  const data = await response.json();

  const items = [];

  Object.entries(data).forEach(([region, years]) => {
    Object.entries(years).forEach(([year, countries]) => {
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
    pileItemOffset: [0, 0],
    pileVisibilityItems: pile => pile.items.length === 1
  });

  return piling;
};

export default createScatterplotPiles;
