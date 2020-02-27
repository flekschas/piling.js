import * as PIXI from 'pixi.js';

import FS from './vitessce.fs';
import VS from './vitessce.vs';
import { CustomBufferResource, rgb2hsv } from './vitessce-utils';

// const DEFAULT_ACTIVE_CHANNELS = [true, true, true, true];

const DEFAULT_COLORS = [
  ...rgb2hsv(255, 0, 0),
  ...rgb2hsv(0, 255, 0),
  ...rgb2hsv(0, 0, 255),
  ...rgb2hsv(255, 128, 0)
];

// prettier-ignore
const DEFAULT_DOMAINS = [
  0, 256 ** 2 - 1,
  0, 256 ** 2 - 1,
  0, 256 ** 2 - 1,
  0, 256 ** 2 - 1
];

const createVitessceRenderer = (
  getData,
  {
    // activeChannels = DEFAULT_ACTIVE_CHANNELS,
    domains = DEFAULT_DOMAINS,
    colors = DEFAULT_COLORS
  }
) => async sources => {
  // const canvas = document.createElement('canvas');

  const geometry = new PIXI.Geometry();
  geometry.addAttribute('aPosition', [-1, -1, 1, -1, 1, 1, -1, 1], 2);
  geometry.addAttribute('aTexCoords', [0, 1, 1, 1, 1, 0, 0, 0], 2);
  geometry.addIndex([0, 1, 2, 0, 3, 2]);

  // PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2;

  // const renderer = new PIXI.Renderer({
  //   view: canvas,
  //   width: size,
  //   height: size
  // });

  // const stage = new PIXI.Container();

  return Promise.all(
    sources.map(async source => {
      const channels = await getData(source);

      const createTexture = (data, { width, height }) => {
        const resource = new CustomBufferResource(data, {
          width,
          height,
          internalFormat: 'R32F',
          format: 'RED',
          type: 'FLOAT'
        });

        return new PIXI.BaseTexture(resource, {
          scaleMode: PIXI.SCALE_MODES.NEAREST
        });
      };

      const textures = channels.reduce((t, tensor, i) => {
        t[`uTexSampler${i}`] = createTexture(tensor.values, {
          width: tensor.shape[1],
          height: tensor.shape[0]
        });
        return t;
      }, {});

      const uniforms = new PIXI.UniformGroup({
        uColors: colors,
        uDomains: domains,
        ...textures
      });

      const shader = PIXI.Shader.from(VS, FS, uniforms);

      const state = new PIXI.State();

      const mesh = new PIXI.Mesh(geometry, shader, state);

      // const graphics = new PIXI.Graphics();
      // graphics.addChild(mesh);

      return new PIXI.Texture(mesh);
    })
  );
};

export default createVitessceRenderer;
