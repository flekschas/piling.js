import createPilingJs from '../src/library';
import { createSvgRenderer } from '../src/renderer';

const SVG_START =
  '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">';
const SVG_END = '</svg>';

const createRandomLinePlot = () => {
  const x1 = Math.random() * 50;
  const y1 = 100 - Math.random() * 100;
  const x2 = 50 + Math.random() * 50;
  const y2 = Math.random() * (100 - y1);
  return [
    SVG_START,
    `<path d="M 0 100 C ${x1} ${y1}, ${x2} ${y2}, 100 0" stroke="currentColor" fill="transparent"/>`,
    SVG_END,
  ].join('');
};

const createSvgLinesPiles = (element, darkMode) => {
  const svgRenderer = createSvgRenderer({
    color: darkMode ? 'white' : 'black',
    width: 600,
    height: 600,
  });

  let data = new Array(100).fill().map((_, i) => ({
    id: i.toString(),
    src: createRandomLinePlot(),
  }));

  const redrawHandler = (pile) => {
    pile.items.forEach((itemId) => {
      data[itemId] = {
        ...data[itemId],
        src: createRandomLinePlot(),
      };
    });
    data = [...data];
    piling.set('items', data);
  };

  const piling = createPilingJs(element, {
    darkMode,
    renderer: svgRenderer,
    items: data,
    pileItemOpacity: (item, i, pile) =>
      (1 / pile.items.length) * (2 / 3) + 1 / 3,
    pileItemOffset: [0, 0],
    pileBackgroundColor: 'rgba(255, 255, 255, 0.85)',
    pileSizeBadge: (pile) => pile.items.length > 1,
    pileContextMenuItems: [
      {
        label: 'Redraw',
        callback: redrawHandler,
      },
      {
        label: 'Split All',
        callback: () => {
          piling.splitAll();
        },
      },
    ],
  });

  // eslint-disable-next-line no-console
  const log = (message) => () => console.log(message);

  piling.subscribe('pileFocus', log('pileFocus'));
  piling.subscribe('pileBlur', log('pileBlur'));
  piling.subscribe('pileActive', log('pileActive'));
  piling.subscribe('pileInactive', log('pileInactive'));
  piling.subscribe('pileEnter', log('pileEnter'));
  piling.subscribe('pileLeave', log('pileLeave'));
  piling.subscribe('pileDrag', log('pileDrag'));
  piling.subscribe('pileDrop', log('pileDrop'));

  return [piling];
};

export default createSvgLinesPiles;
