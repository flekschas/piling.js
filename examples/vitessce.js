import { interpolateGreys } from 'd3-scale-chromatic';
import * as PIXI from 'pixi.js';
import createPilingJs from '../src/library';
import { createRepresentativeAggregator } from '../src/aggregator';
import {
  createMatrixRenderer,
  createRepresentativeRenderer
} from '../src/renderer';
import createVitessceRenderer from './vitessce-renderer';
import { createUmap } from '../src/dimensionality-reducer';
import { createScale } from '../src/utils';

import { rgb2hsv } from './vitessce-utils';
import { supportsWebGl2 } from './utils';

const METADATA_URL =
  'https://vitessce-data.s3.amazonaws.com/0.0.24/master_release/linnarsson/linnarsson.cells.json';

const createVitessce = async (element, darkMode) =>
  supportsWebGl2()
    .then(async () => {
      let response = await fetch(METADATA_URL);
      const metadata = await response.json();

      response = await fetch('data/vitessce/sample.json');
      const data = await response.json();

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

        if (data[id]) {
          data[id] = {
            ...cell,
            data: data[id],
            factors: {
              cluster,
              subcluster
            }
          };
        }

        tsneXDomain[0] = Math.min(tsneXDomain[0], cell.mappings['t-SNE'][0]);
        tsneXDomain[1] = Math.max(tsneXDomain[1], cell.mappings['t-SNE'][0]);
        tsneYDomain[0] = Math.min(tsneYDomain[0], cell.mappings['t-SNE'][1]);
        tsneYDomain[1] = Math.max(tsneYDomain[1], cell.mappings['t-SNE'][1]);
      }, {});

      Object.entries(data).forEach(([id, cell]) => {
        if (!cellsByFactor.Sample) cellsByFactor.Sample = {};

        cell.data = cell.data.map(d => ({
          ...d,
          values: new Float32Array(d.values)
        }));

        cellsByFactor.Sample[id] = cell;
      });

      const tsneXScale = createScale().domain(tsneXDomain);
      const tsneYScale = createScale().domain(tsneYDomain);

      const selectedFactor = 'Sample';

      const itemSize = 64;

      const rgbStr2rgba = (rgbStr, alpha = 1) => {
        return [
          ...rgbStr
            .match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
            .slice(1, 4)
            .map(x => parseInt(x, 10) / 256),
          alpha
        ];
      };

      const createColorMap = (numColors = 256) =>
        new Array(numColors)
          .fill(0)
          .map((x, i) =>
            rgbStr2rgba(interpolateGreys(Math.abs((numColors - i) / numColors)))
          );

      const getData = async source => data[source.id].data;

      let numGenes = 0;
      const createItems = factor =>
        Object.entries(cellsByFactor[factor]).map(([id, cell]) => {
          const item = {
            id,
            embeddingTsne: cell.mappings['t-SNE'],
            embeddingPca: cell.mappings.PCA,
            cellType: cell.factors.cluster,
            cellSubType: cell.factors.subcluster
          };

          const genes = [];
          Object.entries(cell.genes).forEach(([geneName, value]) => {
            item[geneName] = value;
            genes.push(value);
          });

          numGenes = genes.length;

          item.src = {
            id
          };
          item.genes = genes;

          return item;
        });

      const items = createItems(selectedFactor);

      const colors = {
        polyT: [0, 255, 0],
        nuclei: [0, 0, 255]
      };

      const vitessceRenderer = createVitessceRenderer(getData, {
        darkMode: true,
        colors: Object.values(colors),
        domains: null // Auto-scale channels
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
            propertyIsVector: true
          },
          {
            forceDimReduction: true
          }
        );
      };

      const representativeRenderer = createRepresentativeRenderer(
        vitessceRenderer.renderer,
        { backgroundColor: darkMode ? 0xffffff : 0x000000, outerPadding: 0 }
      );

      const representativeAggregator = createRepresentativeAggregator(9, {
        valueGetter: item => Object.values(item.genes)
      });

      const previewAggregator = _items =>
        Promise.resolve(
          _items.map(i => {
            const m = Math.max(...i.genes);
            return { shape: [1, numGenes], data: i.genes.map(x => x / m) };
          })
        );

      const previewRenderer = createMatrixRenderer({
        colorMap: createColorMap(256),
        shape: [1, numGenes]
      });

      const piling = createPilingJs(element, {
        darkMode,
        dimensionalityReducer: umap,
        renderer: vitessceRenderer.renderer,
        coverAggregator: representativeAggregator,
        coverRenderer: representativeRenderer,
        previewAggregator,
        previewRenderer: previewRenderer.renderer,
        items,
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
            callback: umapHandler
          }
        ],
        // previewScaling: pile => [
        //   1,
        //   Math.max(0.1, 1 - (pile.items.length - 2) / 10)
        // ],
        previewBorderColor: darkMode ? 0xffffff : 'rgba(0, 255, 0, 0.66)',
        previewOffset: 2,
        previewPadding: 0.5,
        previewSpacing: 0,
        previewScaleToCover: [true, false]
      });

      const additionalSidebarOptions = [
        // {
        //   id: 'factor',
        //   title: 'Subset',
        //   fields: [
        //     {
        //       name: 'items',
        //       dtype: 'string',
        //       defaultValue: selectedFactor,
        //       values: ['-', ...Object.keys(cellsByFactor)],
        //       labels: [
        //         '-',
        //         ...Object.keys(cellsByFactor).map(
        //           cluster =>
        //             `${cluster} (${Object.keys(cellsByFactor[cluster]).length})`
        //         )
        //       ],
        //       setter: factor => {
        //         vitessceRenderer.clear();
        //         let newItems = createItems(factor);
        //         // piling.set('items', createItems(factor));
        //       }
        //     }
        //   ]
        // },
        {
          id: 'coloring',
          title: 'Coloring',
          fields: [
            {
              name: 'mRNA',
              id: 'hue-mrna',
              labelMinWidth: '4rem',
              dtype: 'float',
              min: 0,
              max: 1,
              numSteps: 360,
              defaultValue: rgb2hsv(colors.polyT)[0],
              onInput: true,
              setter: hue => {
                vitessceRenderer.setColor(0, hue);
                piling.render();
              }
            },
            {
              name: 'Nuclei',
              id: 'hue-nuclei',
              labelMinWidth: '4rem',
              dtype: 'float',
              min: 0,
              max: 1,
              numSteps: 360,
              defaultValue: rgb2hsv(colors.nuclei)[0],
              onInput: true,
              setter: hue => {
                vitessceRenderer.setColor(1, hue);
                piling.render();
              }
            }
          ]
        },
        {
          title: 'Custom Arrange By',
          fields: [
            {
              name: 'Normalized t-SNE',
              action: () => {
                piling.arrangeBy('uv', pile => [
                  tsneXScale(items[pile.index].embeddingTsne[0]),
                  tsneYScale(items[pile.index].embeddingTsne[1])
                ]);
              }
            }
          ]
        }
      ];

      // piling.subscribe(
      //   'itemUpdate',
      //   () => {
      //     setTimeout(() => {
      //       piling.groupBy('cluster', [
      //         {
      //           property: 'genes',
      //           propertyIsVector: true
      //         }
      //       ]);
      //     }, 1500);
      //   },
      //   1
      // );

      return [piling, additionalSidebarOptions];
    })
    .catch(() => {
      document.querySelector('#no-webgl2-support').style.display = 'flex';
    });

export default createVitessce;
