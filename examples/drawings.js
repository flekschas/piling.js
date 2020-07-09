import { sum, unique } from '@flekschas/utils';
import createPilingJs from '../src/library';
import createGoogleQuickDrawRenderer from './google-quickdraw-renderer';
import createGoogleQuickDrawCoverRenderer from './google-quickdraw-cover-renderer';
import createGoogleQuickDrawCoverAggregator from './google-quickdraw-cover-aggregator';

// To counterbalance small counts
const EPS = 0.005;

const regionToLabel = {
  LCN: 'Latin America',
  SAS: 'South Asia',
  SSF: 'South Africa',
  ECS: 'Europe',
  MEA: 'Middle East',
  EAS: 'East Asia',
  NAC: 'North America',
};

const regionToColor = {
  LCN: '#E69F00',
  SAS: '#56B4E9',
  SSF: '#009E73',
  ECS: '#D55E00',
  MEA: '#F0E442',
  EAS: '#CC79A7',
  NAC: '#0072B2',
};

const mapRegion = (mapping, unknown) => (region) =>
  mapping[region.toUpperCase()] || unknown;

const selectedCategory = 'teapot';
const categories = [
  'cake',
  'flower',
  'necklace',
  'piano',
  'power-outlet',
  'teapot',
  'smiley-face',
  'snowman',
];

const createItems = async (category) => {
  const response = await fetch(`data/${category}.json`);
  const items = await response.json();

  items.forEach((item, index) => {
    item.id = `${category}${index}`;
  });
  return items;
};

const createDrawingPiles = async (element, darkMode) => {
  let items = await createItems('necklace');

  const coverOptions = { size: 128, lineWidth: 3, log: darkMode };

  const quickDrawRenderer = createGoogleQuickDrawRenderer();
  const quickDrawCoverAggregator = createGoogleQuickDrawCoverAggregator(
    coverOptions
  );
  const quickDrawCoverRenderer = createGoogleQuickDrawCoverRenderer(
    coverOptions
  );

  const sameRegion = (pileA, pileB) => {
    const regionsA = unique(pileA.items.map((itemId) => items[itemId].region));
    const regionsB = unique(pileB.items.map((itemId) => items[itemId].region));
    return regionsA.every((region, i) => region === regionsB[i]);
  };

  let regionHistogram = [];

  const createRegionHistogram = (_items) => {
    let total = 0;
    regionHistogram = _items.reduce((hist, item) => {
      if (!hist[item.region]) hist[item.region] = 1;
      else ++hist[item.region];
      ++total;
      return hist;
    }, {});

    Object.keys(regionHistogram).forEach((region) => {
      regionHistogram[region] /= total;
    });
  };

  createRegionHistogram(items);

  // Uncomment for `npm run measure-init-time`
  // const el = document.createElement('div');
  // el.id = 'piling-start';
  // document.body.appendChild(el);

  const piling = createPilingJs(element, {
    darkMode,
    renderer: quickDrawRenderer,
    coverRenderer: quickDrawCoverRenderer,
    coverAggregator: quickDrawCoverAggregator,
    items,

    // itemSize: 48, // 200
    // itemSize: 24, // 500
    // itemSize: 16, // 1000
    // itemSize: 12, // 2000
    // itemSize: 10, // 5000

    // columns: 10, // 200
    // columns: 15, // 500
    columns: 20, // 1000
    // columns: 30, // 2000
    // columns: 50, // 5000
    cellPadding: 12,
    // cellPadding: 10, // 200
    // cellPadding: 8, // 500
    // cellPadding: 4, // 1000
    // cellPadding: 2, // 2000
    // cellPadding: 1, // 5000
    pileCoverInvert: darkMode,
    pileItemInvert: darkMode,
    pileItemOffset: [0, 0],
    pileBackgroundColor: darkMode
      ? 'rgba(0, 0, 0, 0)'
      : 'rgba(255, 255, 255, 0)',
    pileBackgroundColorHover: darkMode
      ? 'rgba(0, 0, 0, 1.0)'
      : 'rgba(255, 255, 255, 1.0)',
    pileBorderOpacityHover: 0,
    pileScale: (pile) => 1 + Math.min((pile.items.length - 1) * 0.05, 2),
    pileVisibilityItems: (pile) => pile.items.length === 1,
    backgroundColor: '#ffffff',
    lassoFillColor: '#000000',
    lassoStrokeColor: '#000000',
    // pileLabel: 'region',
    pileLabelColor: mapRegion(regionToColor, '#808080'),
    pileLabelTextColor: darkMode ? 0xffffff : 0x000000,
    pileLabelStackAlign: 'horizontal',
    pileLabelHeight: (pile) => (pile.items.length > 1 ? 9 : 0.5),
    pileLabelSizeTransform: (counts, labels) => {
      const totalCounts = sum(counts);
      let max = 0;
      const normValues = counts.map((c, i) => {
        const observedOverExpected =
          c /
          (totalCounts * (regionHistogram[labels[i]] || 1) + totalCounts * EPS);
        max = Math.max(max, observedOverExpected);
        return observedOverExpected;
      });
      return normValues.map((x) => x / max);
    },
    pileLabelTextMapping: mapRegion(regionToLabel, 'Unknown'),
    zoomScale: (cameraScale) =>
      cameraScale >= 1 ? 1 + (cameraScale - 1) / 2 : cameraScale,
  });

  // Uncomment for `node scripts/measure-***-fps`
  // window.pilingjs = piling;

  // Uncomment for `node scripts/measure-init-time`
  // piling.subscribe(
  //   'itemUpdate',
  //   () => {
  //     const div = document.createElement('div');
  //     div.id = 'piling-ready';
  //     document.body.appendChild(div);
  //   },
  //   1
  // );

  piling.subscribe(
    'itemUpdate',
    async () => {
      await piling.arrangeBy('uv', 'umapEmbedding');
      // Uncomment for `node scripts/measure-***-fps`
      // await new Promise(resolve => setTimeout(resolve, 2000));
      // const div = document.createElement('div');
      // div.id = 'piling-ready';
      // document.body.appendChild(div);
    },
    1
  );

  const additionalSidebarOptions = [
    {
      id: 'positionby',
      title: 'Custom group by',
      fields: [
        {
          name: 'Group by and region',
          dtype: 'string',
          action: () => {
            piling.groupBy('overlap', 0, {
              conditions: [sameRegion],
            });
          },
        },
      ],
    },
    {
      id: 'drawing-category',
      title: 'Drawing Categories',
      fields: [
        {
          name: 'categories',
          dtype: 'string',
          defaultValue: selectedCategory,
          values: categories,
          setter: async (category) => {
            items = await createItems(category);
            createRegionHistogram(items);
            piling.set('items', items);
          },
        },
      ],
    },
  ];

  return [piling, additionalSidebarOptions];
};

export default createDrawingPiles;
