import * as PIXI from 'pixi.js';
import createPilingJs from '../src/library';
import { createRepresentativeAggregator } from '../src/aggregator';
import { createRepresentativeRenderer } from '../src/renderer';
import createVitessceDataFetcher from './vitessce-data-fetcher';
import createVitessceRenderer from './vitessce-renderer';
import { createUmap } from '../src/dimensionality-reducer';
import createBBox from '../src/bounding-box';
import { rgb2hsv } from './vitessce-utils';

const METADATA_URL =
  'https://vitessce-data.s3.amazonaws.com/0.0.20/master_release/linnarsson/linnarsson.cells.json';

const ZARR_URL =
  'https://vitessce-data.storage.googleapis.com/0.0.20/master_release/linnarsson/linnarsson.images.zarr/pyramid/';

const ZARR_MIN_ZOOM = -6;

const ZARR_CHANNELS = {
  polyT: ZARR_URL,
  nuclei: ZARR_URL
};

// Absolute value ranges.
// const ZARR_RANGES = {
//   polyT: [0, 3834],
//   nuclei: [0, 3790]
// };

const createVitessce = async element => {
  const response = await fetch(METADATA_URL);
  const metadata = await response.json();

  // Stratify cells by factors
  const cellsByFactor = {};
  Object.entries(metadata).forEach(([id, cell]) => {
    const { cluster, subcluster } = cell.factors;

    if (!cellsByFactor[cluster]) cellsByFactor[cluster] = {};
    if (!cellsByFactor[subcluster]) cellsByFactor[subcluster] = {};

    cellsByFactor[cluster][id] = cell;
    cellsByFactor[subcluster][id] = cell;
  }, {});

  const selectedFactor = 'Oligodendrocyte MF';

  const itemSize = 64;

  const polyToBbox = polygon =>
    createBBox()(
      polygon.reduce(
        (bBox, point) => ({
          minX: Math.min(bBox.minX, point[0]),
          minY: Math.min(bBox.minY, point[1]),
          maxX: Math.max(bBox.maxX, point[0]),
          maxY: Math.max(bBox.maxY, point[1])
        }),
        {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity
        }
      )
    );

  const padding = 0.25;

  const createItems = factor =>
    Object.entries(cellsByFactor[factor]).map(([id, cell]) => {
      const item = {
        id,
        embeddingTsne: cell.mappings['t-SNE'],
        embeddingPca: cell.mappings.PCA,
        genes: {}
      };

      Object.entries(cell.genes).forEach(([geneName, value]) => {
        item.genes[geneName] = value;
      });

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
        zoomLevel: Math.ceil(zoom)
      };

      return item;
    });

  const items = createItems(selectedFactor);

  const getData = await createVitessceDataFetcher({
    channels: ZARR_CHANNELS,
    minZoom: ZARR_MIN_ZOOM
  });

  const colors = {
    polyT: [255, 128, 0],
    nuclei: [0, 128, 255]
  };

  const vitessceRenderer = createVitessceRenderer(getData, {
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
    vitessceRenderer.renderer
  );

  const representativeAggregator = createRepresentativeAggregator(4, {
    valueGetter: item => Object.values(item.genes)
  });

  const piling = createPilingJs(element, {
    darkMode: true,
    dimensionalityReducer: umap,
    renderer: vitessceRenderer.renderer,
    aggregateRenderer: vitessceRenderer.renderer,
    coverAggregator: representativeAggregator,
    coverRenderer: representativeRenderer,
    items,
    itemSize,
    cellPadding: 8,
    pileItemOffset: () => [Math.random() * 20 - 10, Math.random() * 20 - 10],
    pileItemRotation: () => Math.random() * 20 - 10,
    pileVisibilityItems: pile => pile.items.length === 1,
    pileContextMenuItems: [
      {
        id: 'umapify',
        label: 'UMAPify',
        callback: umapHandler
      }
    ]
  });

  const additionalSidebarOptions = [
    {
      id: 'factor',
      title: 'Cluster',
      fields: [
        {
          name: 'items',
          dtype: 'string',
          defaultValue: selectedFactor,
          values: ['-', ...Object.keys(cellsByFactor)],
          labels: [
            '-',
            ...Object.keys(cellsByFactor).map(
              cluster =>
                `${cluster} (${Object.keys(cellsByFactor[cluster]).length})`
            )
          ],
          setter: factor => {
            vitessceRenderer.clear();
            piling.set('items', createItems(factor));
          }
        }
      ]
    },
    {
      id: 'coloring',
      title: 'Coloring',
      fields: [
        {
          name: 'poly-T hue',
          id: 'polyt-hue',
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
          name: 'nuclei',
          id: 'nuclei-hue',
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
    }
  ];

  return [piling, additionalSidebarOptions];
};

export default createVitessce;
