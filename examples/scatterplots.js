import createPilingJs from '../src/library';
import createScatterplotRenderer from './scatterplot-renderer';
// import { createScatterplotCoverAggregator } from '../src/aggregator';

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

  // const coverAggregator = createScatterplotCoverAggregator();
  const scatterplotRenderer = createScatterplotRenderer();

  const piling = createPilingJs(element, {
    darkMode: true,
    renderer: scatterplotRenderer.renderer,
    // coverAggregator,
    items,
    columns: Object.keys(data).length,
    pileItemOffset: [0, 0]
  });

  return piling;
};

export default createScatterplotPiles;
