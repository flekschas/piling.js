import { Deck, OrthographicView } from '@deck.gl/core';
import { toVoid } from '@flekschas/utils';
import { VivViewerLayer } from '@hubmap/vitessce-image-viewer';
import * as PIXI from 'pixi.js';

const createVitessceRenderer = ({
  channels,
  minZoom,
  size
}) => async sources => {
  const canvas = document.createElement('canvas');

  const gl = canvas.getContext('webgl2');

  const sliderValues = {};
  const colorValues = {};
  const channelsOn = {};
  const colorOptions = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 128, 0]
  ];
  Object.keys(channels).forEach((channel, i) => {
    sliderValues[channel] = [0, 20000];
    colorValues[channel] = colorOptions[i];
    channelsOn[channel] = true;
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
    newCanvas.style.boxShadow = 'inset 0 0 0 1px red';
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
