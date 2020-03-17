import { unique } from '@flekschas/utils';
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

const createDrawingPiles = async (element, darkMode) => {
  const response = await fetch('data/apple.json');
  const items = await response.json();

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

  const piling = createPilingJs(element, {
    darkMode,
    renderer: quickDrawRenderer,
    coverRenderer: quickDrawCoverRenderer,
    coverAggregator: quickDrawCoverAggregator,
    items,
    cellSize: 32,
    itemSize: 32,
    cellPadding: 16,
    pileCoverInvert: darkMode,
    pileItemInvert: darkMode,
    pileItemOffset: [0, 0],
    pileBackgroundColor: darkMode
      ? 'rgba(0, 0, 0, 0.85)'
      : 'rgba(255, 255, 255, 0.85)',
    pileScale: pile => 1 + Math.min((pile.items.length - 1) * 0.05, 2),
    pileVisibilityItems: pile => pile.items.length === 1,
    backgroundColor: '#ffffff',
    lassoFillColor: '#000000',
    lassoStrokeColor: '#000000',
    pileLabel: 'region',
    pileLabelColor: regionToColor,
    pileLabelStackAlign: 'vertical'
  });

  piling.subscribe('itemUpdate', () => {
    piling.arrangeBy('uv', 'umapEmbedding');
  });

  const additionalSidebarOptions = [
    {
      id: 'positionby',
      title: 'Custom group by',
      fields: [
        {
          name: 'Group by and region',
          dtype: 'string',
          action: () => {
            piling.pileBy('overlap', 0, {
              conditions: [sameRegion]
            });
          }
        }
      ]
    }
  ];

  return [piling, additionalSidebarOptions];
};

export default createDrawingPiles;
