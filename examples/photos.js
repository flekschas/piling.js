import createPilingJs from '../src/index';
import { createImageRenderer } from '../src/renderer';

const createPhotoPiles = async element => {
  const imageRenderer = createImageRenderer();

  const response = await fetch('data/photos.json');
  const data = await response.json();

  const piling = createPilingJs(element);

  piling.set('itemSize', 300);
  piling.set('renderer', imageRenderer);
  piling.set('items', data);

  return piling;
};

export default createPhotoPiles;
