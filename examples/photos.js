import createPilingJs from '../src/index';
import { createImageRenderer } from '../src/renderer';

const createPhotoPiles = async element => {
  const imageRenderer = createImageRenderer();
  const piling = createPilingJs(element);

  const response = await fetch('data/photos.json');
  const data = await response.json();

  piling.set('renderer', imageRenderer);
  piling.set('items', data);

  piling.set('grid', [10]);

  return piling;
};

export default createPhotoPiles;
