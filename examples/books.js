import createPilingJs, {
  createImageRenderer,
  createRepresentativeAggregator,
  createRepresentativeRenderer
} from '../src';

const createBookPiles = async (element, darkMode) => {
  const imageRenderer = createImageRenderer();

  const response = await fetch('data/books.json');
  const items = await response.json();
  const renderer = imageRenderer;

  // For previews
  const coverAggregator = _items =>
    Promise.resolve(_items[_items.length - 1].src);
  const previewAggregator = _items =>
    Promise.resolve(_items.map(item => item.edge));

  // For gallery preview
  const representativeRenderer = createRepresentativeRenderer(renderer, {
    backgroundColor: darkMode ? 0xffffff : 0x000000,
    outerPadding: 0
  });

  const representativeAggregator = createRepresentativeAggregator(9, {
    valueGetter: item => item.src
  });

  const piling = createPilingJs(element, {
    darkMode,
    renderer,
    items,
    columns: 3,
    itemSizeRange: [1, 1],
    pileCellAlignment: 'center',
    pileBorderSize: 1,
    cellPadding: 16,
    navigationMode: 'panZoom'
  });

  const defaultProps = {
    coverAggregator: piling.get('coverAggregator'),
    coverRenderer: piling.get('coverRenderer'),
    pileItemOffset: piling.get('pileItemOffset'),
    pileItemRotation: piling.get('pileItemRotation'),
    pileOrderItems: piling.get('pileOrderItems'),
    pileScale: piling.get('pileScale'),
    pileVisibilityItems: piling.get('pileVisibilityItems'),
    previewAggregator: piling.get('previewAggregator'),
    previewItemOffset: piling.get('previewItemOffset'),
    previewRenderer: piling.get('previewRenderer'),
    previewScaleToCover: piling.get('previewScaleToCover')
  };

  const additionalSidebarOptions = [
    {
      title: 'Visual Pile Encoding',
      fields: [
        {
          name: 'Default',
          action: () => {
            piling.set({ ...defaultProps });
          }
        },
        {
          name: 'Random Item Arrangement',
          action: () => {
            piling.set({
              pileScale: pile =>
                pile.items.reduce((sum, index) => sum + items[index].scale, 0) /
                pile.items.length,
              pileItemOffset: (item, i) => [
                i * 2 + (Math.random() * 20 - 10),
                i * -10 + (Math.random() * 8 - 4)
              ],
              pileItemRotation: () => Math.random() * 16 - 8,
              coverAggregator: null,
              coverRenderer: null,
              previewAggregator: null,
              previewRenderer: null,
              pileVisibilityItems: true
            });
          }
        },
        {
          name: 'Left-Aligned Foreshortened Previews',
          action: () => {
            piling.set({
              coverAggregator,
              coverRenderer: renderer,
              previewAggregator,
              previewRenderer: renderer,
              previewAlignment: 'left',
              previewScaleToCover: ['auto', true],
              pileOrderItems: pile => [...pile.items].reverse(),
              pileVisibilityItems: true
            });
          }
        },
        {
          name: 'Gallery Previews',
          action: () => {
            piling.set({
              coverAggregator: representativeAggregator,
              coverRenderer: representativeRenderer,
              pileVisibilityItems: pile => pile.items.length === 1
            });
          }
        }
      ]
    }
  ];

  return [piling, additionalSidebarOptions];
};

export default createBookPiles;
