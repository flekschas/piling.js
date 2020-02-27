import * as PIXI from 'pixi.js';

import FS from './vitessce.fs';
import VS from './vitessce.vs';
import { CustomBufferResource, rgb2hsv } from './vitessce-utils';

// const DEFAULT_ACTIVE_CHANNELS = [true, true, true, true];

const DEFAULT_COLORS = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 128, 0]
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
  const geometry = new PIXI.Geometry();
  geometry.addAttribute('aVertexPosition', [-1, -1, 1, -1, 1, 1, -1, 1], 2);
  geometry.addAttribute('aTextureCoord', [0, 1, 1, 1, 1, 0, 0, 0], 2);
  geometry.addIndex([0, 1, 2, 0, 3, 2]);

  const hsvColors = colors.flatMap(rgb2hsv);

  return Promise.all(
    sources.map(async source => {
      const channels = await getData(source);

      const [height, width] = channels[0].shape;

      const createTexture = data => {
        const resource = new CustomBufferResource(data, {
          width,
          height,
          internalFormat: 'R32F',
          format: 'RED',
          type: 'FLOAT'
        });

        return new PIXI.Texture(
          new PIXI.BaseTexture(resource, {
            scaleMode: PIXI.SCALE_MODES.NEAREST
          })
        );
      };

      const textures = channels.reduce((t, tensor, i) => {
        t[`uTexSampler${i}`] = createTexture(tensor.values);
        return t;
      }, {});

      const uniforms = new PIXI.UniformGroup({
        uColors: hsvColors,
        uDomains: domains,
        ...textures
      });

      const shader = PIXI.Shader.from(VS, FS, uniforms);

      const state = new PIXI.State();

      const mesh = new PIXI.Mesh(geometry, shader, state);
      mesh.width = width;
      mesh.height = height;

      return mesh;
    })
  );
};

export default createVitessceRenderer;
