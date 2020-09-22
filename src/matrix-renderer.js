import * as PIXI from 'pixi.js';

import { CustomBufferResource } from './utils';

import FS from './matrix-renderer.fs';
import VS from './matrix-renderer.vs';

const BLACK_WHITE_COLOR_MAP = [];

const createColorTexture = (colors) => {
  const colorTexRes = Math.max(2, Math.ceil(Math.sqrt(colors.length)));
  const rgba = new Float32Array(colorTexRes ** 2 * 4);
  colors.forEach((color, i) => {
    rgba[i * 4] = color[0]; // r
    rgba[i * 4 + 1] = color[1]; // g
    rgba[i * 4 + 2] = color[2]; // b
    rgba[i * 4 + 3] = color[3]; // a
  });

  return [PIXI.Texture.fromBuffer(rgba, colorTexRes, colorTexRes), colorTexRes];
};

const createMatrixRenderer = ({
  colorMap = BLACK_WHITE_COLOR_MAP,
  domain = [0, 1],
  shape,
} = {}) => {
  const geometry = new PIXI.Geometry();
  geometry.addAttribute('aVertexPosition', [-1, -1, 1, -1, 1, 1, -1, 1], 2);
  geometry.addAttribute('aTextureCoord', [0, 0, 1, 0, 1, 1, 0, 1], 2);
  geometry.addIndex([0, 1, 2, 0, 3, 2]);

  const [uColorMapTex, uColorMapTexRes] = createColorTexture(colorMap);

  const uColorMapSize = colorMap.length - 1;

  let allUniforms = [];

  const renderer = async (sources) =>
    Promise.all(
      sources.map(async (source) => {
        const [height, width] = shape || source.shape;

        const createDataTexture = (data) => {
          const resource = new CustomBufferResource(new Float32Array(data), {
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

        const uniforms = new PIXI.UniformGroup({
          uColorMapTex,
          uColorMapTexRes,
          uColorMapSize,
          uMinValue: domain[0],
          uMaxValue: domain[1],
          uDataTex: createDataTexture(source.data),
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

  renderer.setColorMap = (newColorMap) => {
    const [newColorMapTex, newColorMapTexRes] = createColorTexture(newColorMap);

    allUniforms.forEach(({ uniforms }) => {
      uniforms.uColorMapTex = newColorMapTex;
      uniforms.uColorMapTexRes = newColorMapTexRes;
    });
  };

  renderer.setDomain = (newDomain) => {
    allUniforms.forEach(({ uniforms }) => {
      uniforms.uMinValue = newDomain[0];
      uniforms.uMaxValue = newDomain[1];
    });
  };

  renderer.clear = () => {
    allUniforms = [];
  };

  // Only for backward compatibility
  renderer.renderer = renderer;

  return renderer;
};

export default createMatrixRenderer;
