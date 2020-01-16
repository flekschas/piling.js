import createPilingJs from '../src/library';
import { createImageRenderer } from '../src/renderer';

const createPhotoPiles = async element => {
  const imageRenderer = createImageRenderer();

  const response = await fetch('data/photos.json');
  const data = await response.json();

  const piling = createPilingJs(element);

  piling.set('itemSize', 160);
  piling.set('renderer', imageRenderer);
  piling.set('items', data);

  piling.set('pileCellAlign', 'center');

  piling.set('pileBorderSize', pile => pile.items.length - 1);

  return piling;
};

export default createPhotoPiles;
