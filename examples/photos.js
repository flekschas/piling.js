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

  const handlePileDrop = () => {
    piling.style(
      'itemOpacity',
      (item, pile, i) =>
        (pile.itemContainer.children.length - i) /
        pile.itemContainer.children.length
    );

    // piling.style('pileOpacity', pile => 1 / pile.itemContainer.children.length)

    piling.style(
      'pileScale',
      pile => 1 + (pile.itemContainer.children.length - 1) / 10
    );
  };

  const handlePileEnter = ({ pileId }) => {
    piling.style('pileBorderSize', pileInstance => {
      if (pileId === pileInstance.id) {
        return pileInstance.itemContainer.children.length;
      }
      return null;
    });
  };
  piling.subscribe('pileDrop', handlePileDrop);
  piling.subscribe('pileEnter', handlePileEnter);

  return piling;
};

export default createPhotoPiles;
