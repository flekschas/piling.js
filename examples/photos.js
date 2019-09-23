import createPileJs from '../src/index';
import { createImageRenderer } from '../src/renderer';

import data from './data/photos.json';

const createPhotoPiles = element => {
  const imageRenderer = createImageRenderer();
  const pileJs = createPileJs(element);

  pileJs.set('renderer', imageRenderer);
  pileJs.set('items', data);

  if (window.location.search) {
    pileJs.set('grid', [15]);
    pileJs.set('itemAlignment', false);
  } else {
    pileJs.set('grid', [10]);
  }

  return pileJs;
};

export default createPhotoPiles;
