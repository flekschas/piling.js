import * as PIXI from 'pixi.js';
// From previous image tiling:
// import { openArray } from 'zarr';
import createPilingJs from '../src/library';
import createVitessceRenderer from './vitessce-renderer';
import { createUmap } from '../src/dimensionality-reducer';
import createBBox from '../src/bounding-box';

// const ZARR_URL =
//   'https://vitessce-demo-data.storage.googleapis.com/test-data/vanderbilt-data/vanderbilt_mxif_ims.zarr/mxif_pyramid';

// const ZARR_MIN_ZOOM = -8;

// const ZARR_CHANNELS = {
//   'Cy3 - Synaptopodin (glomerular)': ZARR_URL,
//   'Cy5 - THP (thick limb)': ZARR_URL,
//   'DAPI - Hoescht (nuclei)': ZARR_URL,
//   'FITC - Laminin (basement membrane)': ZARR_URL
// };

const METADATA_URL =
  'https://vitessce-data.s3.amazonaws.com/0.0.20/master_release/linnarsson/linnarsson.cells.json';

const ZARR_URL =
  'https://vitessce-data.storage.googleapis.com/linnarsson.images.zarr/pyramid';

const ZARR_MIN_ZOOM = -6;

const ZARR_CHANNELS = {
  polyT: ZARR_URL,
  nuclei: ZARR_URL
};

// From previous image tiling:
// async function getZarrMetadata({
//   channels = ZARR_CHANNELS,
//   minZoom = ZARR_MIN_ZOOM
// } = {}) {
//   function range(len) {
//     return [...Array(len).keys()];
//   }

//   const rootZarrUrl = Object.values(channels)[0]; // all are the same so get first

//   // Known issue with how zarr.js does string concatenation for urls
//   // The prefix gets chunked off for some reason and must be repeating in the config.
//   // https://github.com/gzuidhof/zarr.js/issues/36
//   const prefix = rootZarrUrl.split('/').slice(-1)[0];

//   // Not necessary but this is something we should be parsing from metadata
//   const maxLevel = -minZoom;

//   const zarrStores = range(maxLevel).map(i => {
//     const config = {
//       store: rootZarrUrl,
//       path: `${prefix}/${String(i).padStart(2, '0')}`,
//       mode: 'r'
//     };
//     return openArray(config);
//   });
//   const connections = await Promise.all(zarrStores);

//   // Get other properties for image viewer

//   // Somewhat hard coded for now, but good to keep all this logic in the data loaders so we can edit in the future.
//   const baseLayer = connections[0]; // shape [4, 36040, 52660]
//   // last two dimensions of the 3D array are width and height
//   const [imageHeight, imageWidth] = baseLayer.shape.slice(1);
//   // chunks are [4, 512, 512], grab last dimentsion. Maybe add check for if last two are the same?
//   const tileSize = baseLayer.chunks.slice(-1)[0];

//   // Ideally we will also have metadata here about the minZoom so it's not a parameter supplied in App.js
//   return { connections, imageHeight, imageWidth, tileSize, minZoom };
// }

const createVitessce = async element => {
  // From previous image tiling:
  // const { width: baseWidth } = element.getBoundingClientRect();
  // const { imageHeight, imageWidth } = await getZarrMetadata();

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

  // From previous image tiling:
  // const columns = 10;
  // const itemSize = Math.floor(baseWidth / columns);
  // const stepSize = imageWidth / columns;
  // const offset = stepSize / 2;
  // const numRows = Math.ceil(imageHeight / stepSize);
  // const zoomOutLevel = -Math.log2(imageWidth / baseWidth);

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
  let maxYCenterId = -1;

  const createItems = factor =>
    Object.entries(cellsByFactor[factor]).map(([id, cell]) => {
      const item = {
        id,
        embeddingTsne: cell.mappings['t-SNE'],
        embeddingPca: cell.mappings.PCA
      };

      Object.entries(cell.genes).forEach(([geneName, value]) => {
        item[`gene${geneName}`] = value;
      });

      const bBox = polyToBbox(cell.poly);
      const target = cell.xy;
      const cellSize = Math.max(bBox.width, bBox.height);
      const paddedCellSize = cellSize * (1 + padding * 2);
      const zoom = Math.max(
        ZARR_MIN_ZOOM,
        -Math.log2(paddedCellSize / itemSize)
      );

      maxYCenterId =
        maxYCenterId === -1 ||
        target[1] >= cellsByFactor[factor][maxYCenterId].xy[1]
          ? id
          : maxYCenterId;

      item.src = {
        target,
        zoom
      };

      return item;
    });

  const items = createItems(selectedFactor);

  // console.log(imageWidth, imageHeight);

  // console.log(
  //   selectedFactor,
  //   items.length,
  //   maxYCenterId,
  //   cellsByFactor[selectedFactor][maxYCenterId].xy,
  //   items.find(item => item.id === maxYCenterId)
  // );

  // From previous image tiling:
  // const items = new Array(numRows).fill().flatMap((_, i) =>
  //   // eslint-disable-next-line no-shadow
  //   new Array(columns).fill().map((_, j) => ({
  //     src: {
  //       target: [offset + stepSize * j, offset + stepSize * i, 0],
  //       zoom: zoomOutLevel
  //     },
  //     cX: offset + stepSize * j,
  //     cY: offset + stepSize * i
  //   }))
  // );

  const vitessceRenderer = createVitessceRenderer(
    {
      channels: ZARR_CHANNELS,
      minZoom: ZARR_MIN_ZOOM,
      size: itemSize
    },
    {
      colors: [
        [255, 128, 0],
        [0, 128, 255]
      ]
    }
  );

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

  const piling = createPilingJs(element, {
    darkMode: true,
    dimensionalityReducer: umap,
    renderer: vitessceRenderer,
    items: [items.find(item => item.id === maxYCenterId)],
    itemSize,
    cellPadding: 8,
    pileItemAlignment: false,
    pileItemRotation: true,
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
            piling.set('items', createItems(factor));
          }
        }
      ]
    }
  ];

  return [piling, additionalSidebarOptions];
};

export default createVitessce;
