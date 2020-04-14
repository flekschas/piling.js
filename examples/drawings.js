import { sum, unique } from '@flekschas/utils';
import createPilingJs from '../src/library';
import createGoogleQuickDrawRenderer from './google-quickdraw-renderer';
import createGoogleQuickDrawCoverRenderer from './google-quickdraw-cover-renderer';
import createGoogleQuickDrawCoverAggregator from './google-quickdraw-cover-aggregator';

const regionToColor = region => {
  switch (region.toUpperCase()) {
    case 'LCN': // Latin America & Caribbean
      return '#E69F00'; // Orange

    case 'SAS': // South Asia
      return '#56B4E9'; // sky blue

    case 'SSF': // Sub-Saharan Africa
      return '#009E73'; // bluish green

    case 'ECS': // Europe & Central Asia
      return '#D55E00'; // vermillion

    case 'MEA': // Middle East & North Africa
      return '#F0E442'; // yellow

    case 'EAS': // East Asia & Pacific
      return '#CC79A7'; // reddish purple

    case 'NAC': // North America
      return '#0072B2'; // blue

    default:
      return '#808080';
  }
};

const selectedCategory = 'teapot';
const categories = [
  'cake',
  'flower',
  'necklace',
  'piano',
  'power-outlet',
  'teapot',
  'smiley-face',
  'snowman'
];

const createItems = async category => {
  const response = await fetch(`data/${category}.json`);
  const items = await response.json();

  items.forEach((item, index) => {
    item.id = `${category}${index}`;
  });
  return items;
};

const createDrawingPiles = async (element, darkMode) => {
  const response = await fetch('data/teapot-2000.json');
  const items = await response.json();

  items.forEach((item, index) => {
    item.id = `teapot${index}`;
  });

  const coverOptions = { size: 128, lineWidth: 3 };

  const quickDrawRenderer = createGoogleQuickDrawRenderer();
  const quickDrawCoverAggregator = createGoogleQuickDrawCoverAggregator(
    coverOptions
  );
  const quickDrawCoverRenderer = createGoogleQuickDrawCoverRenderer(
    coverOptions
  );

  const sameRegion = (pileA, pileB) => {
    const regionsA = unique(pileA.items.map(itemId => items[itemId].region));
    const regionsB = unique(pileB.items.map(itemId => items[itemId].region));
    return regionsA.every((region, i) => region === regionsB[i]);
  };

  let total = 0;
  const regionHistogram = items.reduce((hist, item) => {
    if (!hist[item.region]) hist[item.region] = 1;
    else ++hist[item.region];
    ++total;
    return hist;
  }, {});

  Object.keys(regionHistogram).forEach(region => {
    regionHistogram[region] /= total;
  });

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
    itemSize: 12, // 2000
    // itemSize: 10, // 5000

    // columns: 10, // 200
    // columns: 15, // 500
    // columns: 20, // 1000
    columns: 30, // 2000
    // columns: 50, // 5000
    // cellPadding: 16,
    // cellPadding: 10, // 200
    // cellPadding: 8, // 500
    // cellPadding: 4, // 1000
    cellPadding: 2, // 2000
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
    pileScale: pile => 1 + Math.min((pile.items.length - 1) * 0.05, 2),
    pileVisibilityItems: pile => pile.items.length === 1,
    backgroundColor: '#ffffff',
    lassoFillColor: '#000000',
    lassoStrokeColor: '#000000',
    // pileLabel: 'region',
    pileLabelColor: regionToColor,
    pileLabelStackAlign: 'horizontal',
    pileLabelHeight: pile => (pile.items.length > 1 ? 12 : 0.5),
    pileLabelSizeTransform: (counts, labels) => {
      const totalCounts = sum(counts);
      let max = 0;
      const normValues = counts.map((c, i) => {
        const observedOverExpected =
          c / (totalCounts * (regionHistogram[labels[i]] || 1));
        max = Math.max(max, observedOverExpected);
        return observedOverExpected;
      });
      return normValues.map(x => x / max);
    },
    zoomScale: cameraScale =>
      cameraScale >= 1 ? 1 + (cameraScale - 1) / 2 : cameraScale
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
              conditions: [sameRegion]
            });
          }
        }
      ]
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
          setter: category => {
            createItems(category).then(_item => {
              piling.set('items', _item);
            });
          }
        }
      ]
    }
  ];

  return [piling, additionalSidebarOptions];
};

export default createDrawingPiles;
