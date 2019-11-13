import createPilingJs from '../src/index';
import { createImageRenderer } from '../src/renderer';

const createPhotoPiles = async element => {
  const imageRenderer = createImageRenderer();
  const piling = createPilingJs(element);

  const response = await fetch('data/photos.json');
  const data = await response.json();

  piling.set('grid', [10]);
  piling.set('renderer', imageRenderer);
  piling.set('items', data);

  const state = piling.exportState();
  // console.log(state);

  // state.grid = [12];
  // state.version = "0.4.0";

  piling.importState(state);

  return piling;
};

export default createPhotoPiles;
