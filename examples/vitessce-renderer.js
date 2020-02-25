import { Deck, OrthographicView } from '@deck.gl/core';
import { toVoid } from '@flekschas/utils';
import { VivViewerLayer } from '@hubmap/vitessce-image-viewer';
import * as PIXI from 'pixi.js';

// VIV currently supports up to 6 right now
const DEFAULT_ACTIVE_CHANNELS = [true, true, true, true, true, true];

const DEFAULT_COLORS = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 128, 0],
  [0, 128, 255],
  [128, 0, 255]
];

// These domains define the color scaling. Give uint16 values the domain can
// be in [0, 256^2 - 1]
const DEFAULT_DOMAINS = [
  [0, 256 ** 2 - 1],
  [0, 256 ** 2 - 1],
  [0, 256 ** 2 - 1],
  [0, 256 ** 2 - 1],
  [0, 256 ** 2 - 1],
  [0, 256 ** 2 - 1]
];

const createVitessceRenderer = (
  { channels, minZoom, size },
  {
    activeChannels = DEFAULT_ACTIVE_CHANNELS,
    domains = DEFAULT_DOMAINS,
    colors = DEFAULT_COLORS
  }
) => async sources => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');

  const sliderValues = {};
  const colorValues = {};
  const channelsOn = {};

  Object.keys(channels).forEach((channel, i) => {
    sliderValues[channel] = domains[i];
    colorValues[channel] = colors[i];
    channelsOn[channel] = activeChannels[i];
  });

  let tilesLoaded;

  const layers = [
    new VivViewerLayer({
      useTiff: false,
      useZarr: true,
      sourceChannels: channels,
      minZoom,
      sliderValues,
      colorValues,
      channelsOn,
      onTileError: error => {
        console.error(error);
      },
      onViewportLoad: () => {
        tilesLoaded = true;
      }
    })
  ];

  const views = [new OrthographicView()];

  let loaded;
  const isLoaded = new Promise(resolve => {
    loaded = resolve;
  });

  const onLoad = () => {
    loaded();
  };

  const deck = new Deck({
    onLoad,
    gl,
    layers,
    views,
    width: `${size}px`,
    height: `${size}px`,
    viewState: { target: [0, 0, 0] }
  });

  const drawToCanvas = () => {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = size;
    newCanvas.height = size;
    const ctx = newCanvas.getContext('2d');

    ctx.drawImage(gl.canvas, 0, 0);

    return newCanvas;
  };

  const render = ({ target, zoom }) =>
    new Promise(resolve => {
      tilesLoaded = false;
      deck.setProps({
        viewState: {
          target,
          zoom
        },
        onAfterRender: () => {
          if (!deck.needsRedraw() && tilesLoaded) {
            resolve(PIXI.Texture.from(drawToCanvas()));
            deck.setProps({ onAfterRender: toVoid });
          }
        }
      });
    });

  await isLoaded;

  const textures = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const source of sources) {
    // eslint-disable-next-line no-await-in-loop
    const texture = await render(source);
    textures.push(texture);
  }

  return textures;
};

export default createVitessceRenderer;
