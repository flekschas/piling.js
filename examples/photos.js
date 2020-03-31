import createPilingJs from '../src/library';
import { createImageRenderer } from '../src/renderer';

const createPhotoPiles = async (element, darkMode) => {
  const imageRenderer = createImageRenderer();

  const response = await fetch('data/pascal-voc-cars.json');
  const data = await response.json();

  const piling = createPilingJs(element);

  piling.set('darkMode', darkMode);

  piling.set('cellSize', 160);
  piling.set('renderer', imageRenderer);
  piling.set('items', data);

  piling.set('pileCellAlignment', 'center');

  piling.set('pileBorderSize', pile => Math.log(pile.items.length));

  piling.set('pileItemOffset', () => [
    Math.random() * 20 - 10,
    Math.random() * 20 - 10
  ]);
  piling.set('pileItemRotation', () => Math.random() * 20 - 10);

  return [piling];
};

export default createPhotoPiles;
