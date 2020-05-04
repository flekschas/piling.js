import * as d3 from 'd3';
import createPilingJs from '../src/library';
import createScatterplotRenderer, {
  DEFAULT_COLOR_RANGE
} from './scatterplot-renderer';
import createScatterplotCoverAggregator from './scatterplot-cover-aggregator';
import createScatterplotPreviewAggregator from './scatterplot-preview-aggregator';
import createScatterplotPreviewRenderer from './scatterplot-preview-renderer';

const colorRangeDarkMode = [
  '#dca237',
  '#6fb2e4',
  '#51b288',
  '#e5d500',
  '#c17da5',
  '#295fcc',
  '#d55e00'
];

const createScatterplotPiles = async (element, darkMode = false) => {
  const response = await fetch('data/worldbank.json');
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
  const padding = [60, 140, 60, 60];
  const dotSizeRange = [12, 24];
  const colorRange = darkMode ? colorRangeDarkMode : DEFAULT_COLOR_RANGE;
  const backgroundColor = darkMode ? '#000' : '#fff';
  const lineColor = darkMode ? '#333' : '#ccc';
  const tickColor = darkMode ? '#444' : '#bbb';
  const textColor = darkMode ? '#fff' : '#000';
  const previewWidth = 15;
  const previewHeight = 10;

  const [paddingTop, paddingRight, paddingBottom, paddingLeft] = padding;

  const cellAspectRatio =
    (width + paddingLeft + paddingRight) /
    (height + paddingTop + paddingBottom);

  const scatterplotRenderer = createScatterplotRenderer({
    width,
    height,
    padding,
    colorRange,
    backgroundColor,
    lineColor,
    tickColor,
    textColor,
    dotSizeRange
  });
  const coverAggregator = createScatterplotCoverAggregator();
  const previewAggregator = createScatterplotPreviewAggregator();
  const previewRenderer = createScatterplotPreviewRenderer({
    width: previewWidth,
    height: previewHeight
  });

  const pileOrderItems = pileState => {
    const itemStates = pileState.items.map(itemId => {
      return { ...items[itemId], id: itemId };
    });
    itemStates.sort((a, b) => {
      if (a.region === b.region) {
        return a.year - b.year;
      }
      return regionOrderIndex[a.region] - regionOrderIndex[b.region];
    });
    return itemStates.map(item => item.id);
  };

  const previewItemYOffset = d3.scaleLinear();

  let beginYear;

  const previewItemOffset = (itemState, itemIndex) => {
    if (itemIndex === 0) {
      beginYear = scatterplotRenderer.yearDomain[0];
      const years = scatterplotRenderer.yearDomain[1] - beginYear + 1;
      const rangeMin = Math.max(
        paddingTop,
        paddingBottom + height / 2 - years * 6.5
      );
      const rangeMax = Math.min(
        paddingTop + height,
        paddingBottom + height / 2 + years * 6.5
      );
      previewItemYOffset
        .domain(scatterplotRenderer.yearDomain)
        .rangeRound([rangeMin, rangeMax]);
    }
    const x =
      regionOrderIndex[itemState.region] * 20 +
      width +
      paddingLeft +
      previewWidth;

    const y = previewItemYOffset(itemState.year);

    return [x, y];
  };

  const piling = createPilingJs(element, {
    darkMode,
    renderer: scatterplotRenderer.renderer,
    coverAggregator,
    coverRenderer: scatterplotRenderer.renderer,
    previewAggregator,
    previewRenderer: previewRenderer.renderer,
    items,
    columns: Object.keys(data).length,
    cellAlign: 'center',
    cellPadding: 9,
    cellAspectRatio,
    pileOrderItems,
    previewItemOffset,
    previewScaling: pile => {
      const regionCount = pile.items.reduce((count, itemId) => {
        if (!count[items[itemId].region]) count[items[itemId].region] = 1;
        count[items[itemId].region] += 1;
        return count;
      }, {});
      return [
        1,
        Math.min(
          1,
          height / Math.max(...Object.values(regionCount)) / (previewHeight + 4)
        )
      ];
    },
    zoomScale: x => x
  });

  piling.arrangeBy('data', 'year', { once: true });

  return [piling];
};

export default createScatterplotPiles;
