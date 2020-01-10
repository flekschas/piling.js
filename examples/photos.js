import createPilingJs from '../src/index';
import { createImageRenderer } from '../src/renderer';

const createPhotoPiles = async element => {
  const imageRenderer = createImageRenderer();

  const response = await fetch('data/photos.json');
  const data = await response.json();

  const piling = createPilingJs(element);

  piling.set('grid', [10]);
  piling.set('renderer', imageRenderer);
  piling.set('items', data);

  piling.set(
    'itemOpacity',
    (item, pile, i) =>
      (pile.itemContainer.children.length - i) /
      pile.itemContainer.children.length
  );

  piling.set('pileOpacity', pile => 1 / pile.itemContainer.children.length);

  piling.set(
    'pileScale',
    pile => 1 + (pile.itemContainer.children.length - 1) / 10
  );

  piling.set('pileBorderSize', () => {
    return null;
  });

  return piling;
};

export default createPhotoPiles;
