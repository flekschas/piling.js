import createPileJs from '../src/index';
import { createImageRenderer } from '../src/renderer';

const createPhotoPiles = async element => {
  const imageRenderer = createImageRenderer();
  const pileJs = createPileJs(element);

  const response = await fetch('data/photos.json');
  const data = await response.json();

  pileJs.set('renderer', imageRenderer);
  pileJs.set('items', data);

  pileJs.set('grid', [10]);

  return pileJs;
};

export default createPhotoPiles;
