import createPilingJs from '../src/library';
import { createImageRenderer } from '../src/renderer';

const createTimeCurvePiles = async element => {
  const response = await fetch('data/time-curve.json');
  const data = await response.json();

  const imageRenderer = createImageRenderer();

  const piling = createPilingJs(element, {
    renderer: imageRenderer,
    items: data,
    itemSize: 128,
    darkMode: true
  });

  piling.arrangeBy('data', [
    {
      property: item => item.umap[0]
    },
    {
      property: item => item.umap[1]
    }
  ]);

  return [piling];
};

export default createTimeCurvePiles;
