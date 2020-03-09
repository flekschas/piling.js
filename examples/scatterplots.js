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

  // width and height are just for the scatterplot, not including the title
  const width = 480;
  const height = 480;
  const paddingHorizontal = 140;
  const paddingVertical = 60;
  const previewWidth = 15;
  const previewHeight = 10;

  const cellAspectRatio =
    (width + paddingHorizontal * 2) / (height + paddingVertical * 2);

  const scatterplotRenderer = createScatterplotRenderer({
    width,
    height,
    paddingV: paddingVertical,
    paddingH: paddingHorizontal
  });
  const coverAggregator = createScatterplotCoverAggregator();
  const previewAggregator = createScatterplotPreviewAggregator();
  const previewRenderer = createScatterplotPreviewRenderer({
    width: previewWidth,
    height: previewHeight
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
      const rangeMin = Math.max(
        paddingVertical,
        paddingVertical + height / 2 - years * 6.5
      );
      const rangeMax = Math.min(
        paddingVertical + height,
        paddingVertical + height / 2 + years * 6.5
      );
      previewItemYOffset
        .domain(scatterplotRenderer.yearDomain)
        .rangeRound([rangeMin, rangeMax]);
    }
    const x =
      regionOrderIndex[itemState.region] * 20 +
      width +
      paddingHorizontal +
      previewWidth;

    const y = previewItemYOffset(itemState.year);

    return [x, y];
  };

  const piling = createPilingJs(element, {
    darkMode: true,
    renderer: scatterplotRenderer.renderer,
    coverAggregator,
    coverRenderer: scatterplotRenderer.renderer,
    previewAggregator,
    previewRenderer: previewRenderer.renderer,
    items,
    columns: Object.keys(data).length,
    cellPadding: 6,
    cellAspectRatio,
    pileScale: pile => 1 + Math.min((pile.items.length - 1) * 0.1, 0.5),
    pileItemOrder,
    previewItemOffset,
    previewSpacing: 3
  });

  piling.arrangeByOnce('data', 'year');

  return piling;
};

export default createScatterplotPiles;
