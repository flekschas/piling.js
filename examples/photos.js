import createPilingJs from '../src/index';
import { createImageRenderer } from '../src/renderer';

const createPhotoPiles = async element => {
  const imageRenderer = createImageRenderer();
  const piling = createPilingJs(element);

  const response = await fetch('data/photos.json');
  const data = await response.json();

  // piling.set('grid', [10]);
  // piling.set('renderer', imageRenderer);
  // piling.set('items', data);

  piling.set({
    grid: [10],
    renderer: imageRenderer,
    items: data
  });

  return piling;
};

export default createPhotoPiles;
