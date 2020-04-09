import { interpolateGreys } from 'd3-scale-chromatic';
import { aggregate, max, unique } from '@flekschas/utils';
import createPilingJs from '../src/library';
import { createImageRenderer } from '../src/renderer';
import { createScale } from '../src/utils';

const createPhotoPiles = async (element, darkMode) => {
  const imageRenderer = createImageRenderer();

  const response = await fetch('data/coco-cars.json');
  const data = await response.json();

  // Extract categories
  const combinedCategories = unique(
    data.flatMap(i => Object.keys(i.categories))
  );

  const catMap = combinedCategories.reduce((mm, combinedCategory) => {
    const [superCat, cat] = combinedCategory.split('/');
    if (!mm.has(superCat)) mm.set(superCat, new Map());
    mm.get(superCat).set(cat, mm.get(superCat).size);
    return mm;
  }, new Map());

  const superCategories = unique(combinedCategories.map(c => c.split('/')[0]));
  const superCatMap = new Map();
  superCategories.forEach((c, i) => {
    superCatMap.set(c, i);
  });

  let maxJ = superCatMap.size;
  const jScales = {
    'super categories': superCategory => superCatMap.get(superCategory)
  };
  catMap.forEach((map, cat) => {
    jScales[cat] = x => map.get(x);
    maxJ = Math.max(maxJ, map.size);
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

  let xAxis = 'super categories';
  let yRange = 10;

  const iScale = createScale(Math.log10)
    .domain([1, 10])
    .range([0, yRange]);

  const el = document.createElement('div');
  el.id = 'piling-start';
  document.body.appendChild(el);

  const piling = createPilingJs(element, {
    darkMode,
    columns: maxJ + 1,
    renderer: imageRenderer,
    items: data,
    pileCellAlignment: 'center',
    cellPadding: 6,
    cellAspectRatio: 1.5,
    pileBorderColor: pile =>
      interpolateGreys(0.2 + (pile.items.length / 500) * 0.8),
    pileBorderSize: pile => Math.log(pile.items.length),
    pileItemOffset: () => [Math.random() * 20 - 10, Math.random() * 20 - 10],
    pileItemRotation: () => Math.random() * 20 - 10
  });

  piling.subscribe(
    'itemUpdate',
    () => {
      const div = document.createElement('div');
      div.id = 'piling-ready';
      document.body.appendChild(div);
    },
    1
  );

  const getSuperCat = item => {
    const c = `${item.mainSuperCategory}/${item.mainCategory}`;
    return [
      Math.round(iScale(areaScale(max(item.categories[c])))),
      jScales[xAxis](item.mainSuperCategory)
    ];
  };

  const getCat = item => {
    const cats = Object.keys(item.categories)
      .map(c => c.split('/'))
      .filter(c => c[0] === xAxis)
      .map(c => `${c[0]}/${c[1]}`);

    if (cats.length === 0) {
      return [getSuperCat(item)[0], maxJ];
    }

    const largestCat = cats.reduce(
      (largest, cat) => {
        const catMax = max(item.categories[cat]);
        if (catMax > largest[0]) {
          return [catMax, cat];
        }
        return largest;
      },
      [-Infinity, '']
    );

    return [
      Math.round(iScale(areaScale(largestCat[0]))),
      jScales[xAxis](largestCat[1].split('/')[1])
    ];
  };

  const whenArranged = piling.arrangeBy('ij', pile => {
    const item = data[pile.id];
    return xAxis === 'super categories' ? getSuperCat(item) : getCat(item);
  });

  whenArranged.then(() => {
    // piling.groupBy('grid');
  });

  const additionalSidebarOptions = [
    {
      id: 'factor',
      title: 'Arrange by category',
      fields: [
        {
          name: 'arrange',
          width: '4rem',
          action: async () => {
            iScale.range([0, yRange - 1]);

            await piling.arrangeBy('ij', pile => {
              const item = data[pile.id];
              return xAxis === 'super categories'
                ? getSuperCat(item)
                : getCat(item);
            });
          },
          subInputs: [
            {
              dtype: 'string',
              values: ['super categories', ...superCategories],
              defaultValue: xAxis,
              setter: prop => {
                xAxis = prop;
              }
            },
            {
              name: '# rows',
              labelMinWidth: '4rem',
              dtype: 'int',
              min: 2,
              max: 20,
              numSteps: 18,
              defaultValue: yRange,
              hideCheckbox: true,
              setter: value => {
                yRange = value;
                iScale.range([0, yRange - 1]);
              }
            }
          ]
        }
      ]
    }
  ];

  return [piling, additionalSidebarOptions];
};

export default createPhotoPiles;
