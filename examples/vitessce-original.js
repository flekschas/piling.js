import { interpolateGreys } from 'd3-scale-chromatic';
import * as PIXI from 'pixi.js';
import createPilingJs from '../src/library';
import { createRepresentativeAggregator } from '../src/aggregator';
import {
  createMatrixRenderer,
  createRepresentativeRenderer,
} from '../src/renderer';
import createVitessceDataFetcher from './vitessce-data-fetcher';
import createVitessceRenderer from './vitessce-renderer';
import { createUmap } from '../src/dimensionality-reducer';
import createBBox from '../src/bounding-box';
import { createScale } from '../src/utils';

import { rgb2hsv } from './vitessce-utils';

const METADATA_URL =
  'https://vitessce-data.s3.amazonaws.com/0.0.24/master_release/linnarsson/linnarsson.cells.json';

const ZARR_URL =
  'https://vitessce-data.storage.googleapis.com/0.0.24/master_release/linnarsson/linnarsson.images.zarr/pyramid/';

const ZARR_MIN_ZOOM = -6;

const ZARR_CHANNELS = {
  polyT: ZARR_URL,
  nuclei: ZARR_URL,
};

// Absolute value ranges.
// const ZARR_RANGES = {
//   polyT: [0, 3834],
//   nuclei: [0, 3790]
// };

const createVitessce = async (element, darkMode) => {
  const response = await fetch(METADATA_URL);
  const metadata = await response.json();

  // Stratify cells by factors
  const cellsByFactor = {};
  const tsneXDomain = [Infinity, -Infinity];
  const tsneYDomain = [Infinity, -Infinity];
  Object.entries(metadata).forEach(([id, cell]) => {
    const { cluster, subcluster } = cell.factors;

    if (!cellsByFactor[cluster]) cellsByFactor[cluster] = {};
    if (!cellsByFactor[subcluster]) cellsByFactor[subcluster] = {};

    cellsByFactor[cluster][id] = cell;
    cellsByFactor[subcluster][id] = cell;

    tsneXDomain[0] = Math.min(tsneXDomain[0], cell.mappings['t-SNE'][0]);
    tsneXDomain[1] = Math.max(tsneXDomain[1], cell.mappings['t-SNE'][0]);
    tsneYDomain[0] = Math.min(tsneYDomain[0], cell.mappings['t-SNE'][1]);
    tsneYDomain[1] = Math.max(tsneYDomain[1], cell.mappings['t-SNE'][1]);
  }, {});

  const tsneXScale = createScale().domain(tsneXDomain);
  const tsneYScale = createScale().domain(tsneYDomain);

  const selectedFactor = 'Oligodendrocyte MF';

  const itemSize = 64;

  const polyToBbox = (polygon) =>
    createBBox()(
      polygon.reduce(
        (bBox, point) => ({
          minX: Math.min(bBox.minX, point[0]),
          minY: Math.min(bBox.minY, point[1]),
          maxX: Math.max(bBox.maxX, point[0]),
          maxY: Math.max(bBox.maxY, point[1]),
        }),
        {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity,
        }
      )
    );

  const padding = 0.25;

  const rgbStr2rgba = (rgbStr, alpha = 1) => {
    return [
      ...rgbStr
        .match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        .slice(1, 4)
        .map((x) => parseInt(x, 10) / 256),
      alpha,
    ];
  };

  const createColorMap = (numColors = 256) =>
    new Array(numColors)
      .fill(0)
      .map((x, i) =>
        rgbStr2rgba(interpolateGreys(Math.abs((numColors - i) / numColors)))
      );

  const getData = await createVitessceDataFetcher({
    channels: ZARR_CHANNELS,
    minZoom: ZARR_MIN_ZOOM,
  });

  let numGenes = 0;
  const createItems = (factor) =>
    Object.entries(cellsByFactor[factor]).map(([id, cell]) => {
      const item = {
        id,
        embeddingTsne: cell.mappings['t-SNE'],
        embeddingPca: cell.mappings.PCA,
      };

      const genes = [];
      Object.entries(cell.genes).forEach(([geneName, value]) => {
        item[geneName] = value;
        genes.push(value);
      });

      numGenes = genes.length;

      const bBox = polyToBbox(cell.poly);
      const cellSize = Math.max(bBox.width, bBox.height);
      const paddedCellSize = cellSize * (1 + padding * 2);
      const zoom = Math.max(
        ZARR_MIN_ZOOM,
        -Math.log2(paddedCellSize / itemSize)
      );

      item.src = {
        minX: bBox.minX - bBox.width * padding,
        minY: bBox.minY - bBox.height * padding,
        maxX: bBox.maxX + bBox.width * padding,
        maxY: bBox.maxY + bBox.height * padding,
        cX: bBox.cX,
        cY: bBox.cY,
        zoom,
        zoomLevel: Math.ceil(zoom),
        genes,
      };

      return item;
    });

  const items = createItems(selectedFactor);

  // function download(content, fileName, contentType) {
  //   const a = document.createElement('a');
  //   const file = new Blob([content], { type: contentType });
  //   a.href = URL.createObjectURL(file);
  //   a.download = fileName;
  //   a.click();
  // }

  // const rleEncode = array => {
  //   let run = 0;
  //   const o = [];

  //   for (let i = 0; i < array.length; i++) {
  //     if (!array[i]) {
  //       run++;
  //     } else {
  //       if (run > 0) {
  //         o.push(0, run);
  //         run = 0;
  //       }
  //       o.push(array[i]);
  //     }
  //   }

  //   return o;
  // };

  // const rleDecode = d => {
  //   const o = new Float32Array(d.size);

  //   let k = 0;
  //   for (let i = 0; i < d.rle.length; i++) {
  //     if (!d.rle[i]) {
  //       k += d.rle[i + 1];
  //       i++; // Skip next number
  //     } else {
  //       o[k] = d.rle[i];
  //       k++;
  //     }
  //   }

  //   return o;
  // };

  // const downloadItems = async items => {
  //   const data = {};

  //   // eslint-disable-next-line no-restricted-syntax
  //   for (const item of items) {
  //     // eslint-disable-next-line no-await-in-loop
  //     const d = await getData(item.src);
  //     data[item.id] = d.map(daddy => ({
  //       shape: daddy.shape,
  //       dtype: daddy.dtype,
  //       size: daddy.size,
  //       values: Array.from(daddy.values)
  //       // rle: rleEncode(daddy.values)
  //     }));
  //   }

  //   download(JSON.stringify(data), 'vitessce-data.json', 'application/json');
  // };

  const colors = {
    // polyT: [255, 128, 0],
    // nuclei: [0, 128, 255]
    polyT: [0, 0, 255],
    nuclei: [0, 255, 0],
  };

  const vitessceRenderer = createVitessceRenderer(getData, {
    darkMode: true,
    colors: Object.values(colors),
    domains: null, // Auto-scale channels
  });

  const umap = createUmap();

  const umapHandler = () => {
    piling.arrangeByOnce(
      'data',
      {
        property: (item, id, index, instance) => {
          const gfx = new PIXI.Graphics();
          gfx.addChild(instance.image.sprite);
          const pixels = piling.renderer.extract.pixels(gfx);
          return pixels;
        },
        propertyIsVector: true,
      },
      {
        forceDimReduction: true,
      }
    );
  };

  const representativeRenderer = createRepresentativeRenderer(
    vitessceRenderer.renderer,
    { backgroundColor: darkMode ? 0xffffff : 0x000000, outerPadding: 0 }
  );

  const representativeAggregator = createRepresentativeAggregator(9, {
    valueGetter: (item) => Object.values(item.src.genes),
  });

  const previewAggregator = (_items) =>
    Promise.resolve(
      _items.map((i) => {
        const m = Math.max(...i.src.genes);
        return { shape: [1, numGenes], data: i.src.genes.map((x) => x / m) };
      })
    );

  const previewRenderer = createMatrixRenderer({
    colorMap: createColorMap(256),
    shape: [1, numGenes],
  });

  const piling = createPilingJs(element, {
    darkMode,
    dimensionalityReducer: umap,
    renderer: vitessceRenderer.renderer,
    coverAggregator: representativeAggregator,
    coverRenderer: representativeRenderer,
    previewAggregator,
    previewRenderer: previewRenderer.renderer,
    items: items.slice(0, 1),
    itemSize,
    cellSize: 64,
    cellPadding: 8,
    pileBackgroundColor: darkMode ? 0xffffff : 0x000000,
    pileBackgroundOpacity: 1,
    pileBorderColor: darkMode ? 0xffffff : 0x000000,
    pileBorderSize: 0.5,
    pileCoverScale: representativeRenderer.scaler,
    // pileVisibilityItems: pile => pile.items.length === 1,
    pileContextMenuItems: [
      {
        id: 'umapify',
        label: 'UMAPify',
        callback: umapHandler,
      },
    ],
    // previewScaling: pile => [
    //   1,
    //   Math.max(0.1, 1 - (pile.items.length - 2) / 10)
    // ],
    previewBorderColor: darkMode ? 0xffffff : 'rgba(0, 255, 0, 0.66)',
    previewOffset: 2,
    previewPadding: 0.5,
    previewSpacing: 4,
    previewScaleToCover: [true, false],
  });

  const additionalSidebarOptions = [
    {
      id: 'factor',
      title: 'Subset',
      fields: [
        {
          name: 'items',
          dtype: 'string',
          defaultValue: selectedFactor,
          values: ['-', ...Object.keys(cellsByFactor)],
          labels: [
            '-',
            ...Object.keys(cellsByFactor).map(
              (cluster) =>
                `${cluster} (${Object.keys(cellsByFactor[cluster]).length})`
            ),
          ],
          setter: (factor) => {
            vitessceRenderer.clear();
            piling.set('items', createItems(factor));
          },
        },
      ],
    },
    {
      id: 'coloring',
      title: 'Coloring',
      fields: [
        {
          name: 'poly-T',
          labelMinWidth: '4rem',
          id: 'polyt-hue',
          dtype: 'float',
          min: 0,
          max: 1,
          numSteps: 360,
          defaultValue: rgb2hsv(colors.polyT)[0],
          onInput: true,
          setter: (hue) => {
            vitessceRenderer.setColor(0, hue);
            piling.render();
          },
        },
        {
          name: 'nuclei',
          labelMinWidth: '4rem',
          id: 'nuclei-hue',
          dtype: 'float',
          min: 0,
          max: 1,
          numSteps: 360,
          defaultValue: rgb2hsv(colors.nuclei)[0],
          onInput: true,
          setter: (hue) => {
            vitessceRenderer.setColor(1, hue);
            piling.render();
          },
        },
      ],
    },
    {
      title: 'Custom Arrange By',
      fields: [
        {
          name: 'Normalized t-SNE',
          action: () => {
            piling.arrangeBy('uv', (pile) => [
              tsneXScale(items[pile.index].embeddingTsne[0]),
              tsneYScale(items[pile.index].embeddingTsne[1]),
            ]);
          },
        },
      ],
    },
  ];

  // setTimeout(() => {
  //   piling.pileBy('cluster', [
  //     {
  //       property: 'embeddingTsne',
  //       propertyIsVector: true
  //     }
  //   ]);
  // }, 5000);

  return [piling, additionalSidebarOptions];
};

export default createVitessce;
