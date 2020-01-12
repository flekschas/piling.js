import createPilingJs from '../src/library';
import { createImageRenderer } from '../src/renderer';

const createPhotoPiles = async element => {
  const imageRenderer = createImageRenderer();

  const response = await fetch('data/photos.json');
  const data = await response.json();

  const piling = createPilingJs(element);

  piling.set('itemSize', 300);
  piling.set('renderer', imageRenderer);
  piling.set('items', data);
  piling.set('itemPadding', 10);

  piling.set('pileCellAlign', 'center');

  piling.set('itemOpacity', (item, pile, i) => (pile.size - i) / pile.size);

  piling.set('pileOpacity', pile => 1 / pile.size);

  piling.set('pileScale', pile => 1 + (pile.size - 1) / 10);

  piling.set('pileBorderSize', () => {
    return null;
  });

  return piling;
};

export default createPhotoPiles;
