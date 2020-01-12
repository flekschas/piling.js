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
    `<path d="M 0 100 C ${x1} ${y1}, ${x2} ${y2}, 100 0" stroke="black" fill="transparent"/>`,
    SVG_END
  ].join('');
};

const createSvgLinesPiles = element => {
  const svgRenderer = createSvgRenderer();

  const data = new Array(100)
    .fill(0)
    .map(() => ({ src: createRandomLinePlot() }));

  const piling = createPilingJs(element, {
    renderer: svgRenderer,
    items: data,
    itemAlignment: ['top', 'bottom', 'left', 'right'],
    itemOpacity: (item, pile) => {
      return 1 / pile.size;
    },
    pileScale: pile => 1 + Math.min((pile.size - 1) * 0.2, 2),
    pileBorderSize: pile => pile.size - 1,
    pileBackgroundColor: 'rgba(255, 255, 255, 0.66)',
    backgroundColor: '#ffffff',
    lassoFillColor: '#000000',
    lassoStrokeColor: '#000000'
  });

  const log = message => () => console.log(message);

  piling.subscribe('pileFocus', log('pileFocus'));
  piling.subscribe('pileBlur', log('pileBlur'));
  piling.subscribe('pileActive', log('pileActive'));
  piling.subscribe('pileInactive', log('pileInactive'));
  piling.subscribe('pileEnter', log('pileEnter'));
  piling.subscribe('pileLeave', log('pileLeave'));
  piling.subscribe('pileDrag', log('pileDrag'));
  piling.subscribe('pileDrop', log('pileDrop'));

  return piling;
};

export default createSvgLinesPiles;
