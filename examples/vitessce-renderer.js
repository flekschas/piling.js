import { min, max } from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import FS from './vitessce.fs';
import VS from './vitessce.vs';
import { rgb2hsv } from './vitessce-utils';
import { CustomBufferResource } from '../src/utils';

const DEFAULT_COLORS = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 128, 0],
];

// prettier-ignore
const DEFAULT_DOMAINS = [
  [0, 256 ** 2 - 1],
  [0, 256 ** 2 - 1],
  [0, 256 ** 2 - 1],
  [0, 256 ** 2 - 1]
];

const createVitessceRenderer = (
  getData,
  {
    darkMode = false,
    domains: customDomains = null,
    colors: customColors = [],
  } = {}
) => {
  const geometry = new PIXI.Geometry();
  geometry.addAttribute('aVertexPosition', [-1, -1, 1, -1, 1, 1, -1, 1], 2);
  geometry.addAttribute('aTextureCoord', [0, 1, 1, 1, 1, 0, 0, 0], 2);
  geometry.addIndex([0, 1, 2, 0, 3, 2]);

  const colors = DEFAULT_COLORS.flatMap((domain, i) => {
    if (customColors[i]) return rgb2hsv(customColors[i]);
    return rgb2hsv(domain);
  });

  const domains = Array.isArray(customDomains)
    ? new Float32Array(
        DEFAULT_DOMAINS.flatMap((domain, i) => {
          if (customDomains[i]) return customDomains[i];
          return domain;
        })
      )
    : null;

  let allUniforms = [];

  const renderer = async (sources) =>
    Promise.all(
      sources.map(async (source) => {
        const channels = await getData(source);

        const [height, width] = channels[0].shape;

        const createTexture = (data) => {
          const resource = new CustomBufferResource(data, {
            width,
            height,
            internalFormat: 'R32F',
            format: 'RED',
            type: 'FLOAT',
          });

          return new PIXI.Texture(
            new PIXI.BaseTexture(resource, {
              scaleMode: PIXI.SCALE_MODES.NEAREST,
            })
          );
        };

        const valueRanges =
          domains === null
            ? channels.flatMap((tensor) => [
                min(tensor.values),
                max(tensor.values),
              ])
            : domains;

        const textures = channels.reduce((t, tensor, i) => {
          t[`uTexSampler${i}`] = createTexture(tensor.values);
          return t;
        }, {});

        const uniforms = new PIXI.UniformGroup({
          uBackground: darkMode ? 0.0 : 1.0,
          uComboModifier: darkMode ? 1.0 : -1.0, // addition vs substraction
          uColors: colors,
          uDomains: valueRanges,
          ...textures,
        });

        allUniforms.push(uniforms);

        const shader = PIXI.Shader.from(VS, FS, uniforms);

        const state = new PIXI.State();

        const mesh = new PIXI.Mesh(geometry, shader, state);
        mesh.width = width;
        mesh.height = height;

        return mesh;
      })
    );

  const setColor = (i, hue) => {
    colors[i * 3] = hue;
    allUniforms.forEach(({ uniforms }) => {
      uniforms.uColors[i * 3] = hue;
    });
  };

  const clear = () => {
    allUniforms = [];
  };

  return {
    clear,
    renderer,
    setColor,
  };
};

export default createVitessceRenderer;
