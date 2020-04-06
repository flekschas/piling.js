import { aggregate, max, unique } from '@flekschas/utils';
import createPilingJs from '../src/library';
import { createImageRenderer } from '../src/renderer';
import { createScale } from '../src/utils';

const createPhotoPiles = async (element, darkMode) => {
  const imageRenderer = createImageRenderer();

  const response = await fetch('data/coco-cars.json');
  const data = await response.json();

  const piling = createPilingJs(element);

  // Extract categories
  const combinedCategories = unique(
    data.flatMap(i => Object.keys(i.categories))
  );
  // const categories = combinedCategories.map(c => c.split('/')[1]);
  const superCategories = unique(combinedCategories.map(c => c.split('/')[0]));
  const superCatToIdx = new Map();
  superCategories.forEach((c, i) => {
    superCatToIdx.set(c, i);
  });

  // Extract annotation size
  const minMaxArea = aggregate(
    data.map(i =>
      max(
        Object.values(i.categories[`${i.mainSuperCategory}/${i.mainCategory}`])
      )
    ),
    [Math.min, Math.max],
    [Infinity, -Infinity]
  );

  // Needed to use log scaling for `iScale`
  const areaScale = createScale()
    .domain(minMaxArea)
    .range([1, 10]);

  const iScale = createScale(Math.log10)
    .domain([1, 10])
    .range([0, 10]);

  const jScale = superCategory => superCatToIdx.get(superCategory);

  piling.set('darkMode', darkMode);

  piling.set('columns', superCategories.length);
  piling.set('renderer', imageRenderer);
  piling.set('items', data);

  piling.set('pileCellAlignment', 'center');

  piling.set('pileBorderSize', pile => Math.log(pile.items.length));

  piling.set('pileItemOffset', () => [
    Math.random() * 20 - 10,
    Math.random() * 20 - 10
  ]);
  piling.set('pileItemRotation', () => Math.random() * 20 - 10);

  const whenArranged = piling.arrangeBy('ij', pile => {
    const item = data[pile.id];
    const c = `${item.mainSuperCategory}/${item.mainCategory}`;
    const i = Math.round(iScale(areaScale(max(item.categories[c]))));
    const j = jScale(item.mainSuperCategory);
    return [i, j];
  });

  whenArranged.then(() => {
    piling.groupBy('grid');
  });

  return [piling];
};

export default createPhotoPiles;
