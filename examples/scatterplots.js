import createPilingJs from '../src/library';
import createScatterplotRenderer from './scatterplot-renderer';
// import { createScatterplotCoverAggregator } from '../src/aggregator';

const createScatterplotPiles = async element => {
  const response = await fetch('data/worldbank-objects.json');
  const data = await response.json();

  const items = [];

  const regions = Object.keys(data);
  const regionsData = Object.values(data);
  const years = Object.keys(regionsData[0]);

  years.forEach((year, yearIndex) => {
    regions.forEach((region, regionIndex) => {
      const item = {};
      item.src = [];

      const regionData = Object.values(regionsData[regionIndex]);
      const countriesData = Object.values(regionData[yearIndex]);
      const countriesCode = Object.keys(regionData[yearIndex]);

      countriesCode.forEach((countryCode, index) => {
        const countryData = countriesData[index];
        if (countryData.fertilityRate && countryData.lifeExpectancy) {
          item.src.push({
            year,
            region,
            countryCode,
            ...countryData
          });
        }
      });
      items.push(item);
    });
  });

  const columns = regions.length;

  // const coverAggregator = createScatterplotCoverAggregator();
  const scatterplotRenderer = createScatterplotRenderer();

  const piling = createPilingJs(element, {
    renderer: scatterplotRenderer.renderer,
    // coverAggregator,
    items,
    columns,
    pileItemOffset: [0, 0]
  });

  return piling;
};

export default createScatterplotPiles;
