import { pipe, withConstructor } from '@flekschas/utils';
import * as PIXI from 'pixi.js';

const COLOR = [0.0, 0.0, 0.0, 1.0];
const ROUNDING = 0.5;
const RECT_POS = [0, 0];
const RECT_SIZE = [0.5, 0.5];
const VERTEX_POS = [-1, -1, 1, -1, 1, 1, -1, 1];
const INDEX = [0, 1, 2, 0, 3, 2];

const VS = `precision mediump float;
// From PIXI
uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

attribute vec2 aVertexPosition;

varying vec2 vTexPos;

void main() {
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
  vTexPos = aVertexPosition;
}
`;

const FS = `precision mediump float;
float udRoundBox(vec2 p, vec2 b, float r) {
  return length(max(abs(p) - b, 0.0)) - r;
}

uniform vec2 uRectPos;
uniform vec2 uRectSize;
uniform vec4 uColor;
uniform float uRounding;
uniform float uSize;

varying vec2 vTexPos;

void main() {
  float texel = 1.0 / uSize;
  float dist = udRoundBox(vTexPos - uRectPos, uRectSize, uRounding);

  gl_FragColor = vec4(uColor.rgb, uColor.a * max(0.0, 1.0 - (dist * uSize * 2.0)));
}`;

const GEOMETRY = new PIXI.Geometry();
GEOMETRY.addAttribute('aVertexPosition', VERTEX_POS, 2);
GEOMETRY.addIndex(INDEX);

const STATE = new PIXI.State();

const createRoundedRectangleFactory = ({
  color = COLOR,
  rounding = ROUNDING,
  size = 1,
} = {}) => {
  let uniforms = {
    uColor: color,
    uRounding: rounding,
    uRectPos: RECT_POS,
    uRectSize: RECT_SIZE,
    uSize: size,
  };

  const uniformGroup = new PIXI.UniformGroup(uniforms);
  const shader = PIXI.Shader.from(VS, FS, uniformGroup);

  const create = () => {
    const mesh = new PIXI.Mesh(GEOMETRY, shader, STATE);
    mesh.width = uniforms.uSize / window.devicePixelRatio;
    mesh.height = uniforms.uSize / window.devicePixelRatio;
    return mesh;
  };

  const mesh = create();

  const setColor = (newColor) => {
    uniforms.uColor = newColor;
  };

  const destroy = () => {
    mesh.destroy();
    uniforms = {};
  };

  const setSize = (newSize) => {
    uniforms.uSize = newSize * window.devicePixelRatio;
  };

  return pipe(withConstructor(createRoundedRectangleFactory))({
    create,
    destroy,
    setColor,
    setSize,
  });
};

export default createRoundedRectangleFactory;
