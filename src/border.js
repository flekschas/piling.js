import {
  pipe,
  withConstructor,
  withForwardedMethod,
  withStaticProperty
} from '@flekschas/utils';
import * as PIXI from 'pixi.js';

const createBorder = initialOptions => {
  // prettier-ignore
  const vertexPositions = new Float32Array([
    // top
    -1, 1,
    -0.9, 1,
    0.9, 1,
    1, 1,
    // right
    1, 0.9,
    1,-0.9,
    // bottom
    1, -1,
    0.9, -1,
    -0.9, -1,
    -1, -1,
    // left
    -1,-0.9,
    -1, 0.9,
    // inner top
    -0.9, 0.9,
    0.9, 0.9,
    // inner bottom
    0.9, -0.9,
    -0.9, -0.9,
  ]);

  // prettier-ignore
  const indices = new Uint16Array([
    // top
    0, 3, 13,
    13, 12, 0,
    // right
    3, 6, 14,
    14, 13, 3,
    // bottom
    6, 9, 15,
    15, 14, 6,
    // left
    9, 0, 12,
    12, 15, 9
  ]);

  let align = 'outer';

  const setAlign = newAlign => {
    align = newAlign;
  };

  let color = [0, 0, 0];

  const setColor = newColor => {
    color = newColor.slice(0, 3);
  };

  let opacity = 1;

  const setOpacity = newOpacity => {
    opacity = newOpacity;
  };

  let width = 1;
  let height = 1;

  const setWidth = newWidth => {
    width = newWidth;
  };

  const setHeight = newHeight => {
    height = newHeight;
  };

  let size = 1;

  const setSize = newSize => {
    size = newSize;
  };

  const updatedVertices = () => {
    const sx = size;
    const sy = size;

    let xPad = 0;
    let yPad = 0;

    if (align === 'inner') {
      xPad = 2 * sx;
      yPad = 2 * sy;
    }

    const w = width - xPad;
    const h = height - yPad;
    const oH = h + 2 * sy; // outer height

    // top
    vertexPositions[0] = 0;
    vertexPositions[1] = oH;
    vertexPositions[2] = size;
    vertexPositions[3] = oH;
    vertexPositions[4] = size + w;
    vertexPositions[5] = oH;
    vertexPositions[6] = size + w + size;
    vertexPositions[7] = oH;
    // right
    vertexPositions[8] = vertexPositions[6];
    vertexPositions[9] = oH - size;
    vertexPositions[10] = vertexPositions[6];
    vertexPositions[11] = oH - size - h;
    // bottom
    vertexPositions[12] = vertexPositions[6];
    vertexPositions[13] = oH - size - h - size;
    vertexPositions[14] = size + w;
    vertexPositions[15] = vertexPositions[13];
    vertexPositions[16] = size;
    vertexPositions[17] = vertexPositions[13];
    vertexPositions[18] = 0;
    vertexPositions[19] = vertexPositions[13];
    // left
    vertexPositions[20] = 0;
    vertexPositions[21] = oH - size - h;
    vertexPositions[22] = 0;
    vertexPositions[23] = oH - size;
    // inner top
    vertexPositions[24] = size;
    vertexPositions[25] = oH - size;
    vertexPositions[26] = size + w;
    vertexPositions[27] = oH - size;
    // inner bottom
    vertexPositions[28] = size + w;
    vertexPositions[29] = oH - size - h;
    vertexPositions[30] = size;
    vertexPositions[31] = oH - size - h;

    return vertexPositions;
  };

  const geometry = new PIXI.Geometry()
    .addAttribute('aVertexPosition', vertexPositions, 2)
    .addIndex(indices);

  const uniforms = new PIXI.UniformGroup({ uColor: color, uOpacity: opacity });

  const shader = PIXI.Shader.from(
    `
    precision mediump float;

    uniform mat3 projectionMatrix;
    uniform mat3 translationMatrix;

    attribute vec2 aVertexPosition;

    void main () {
      gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    }`,
    `
    uniform vec3 uColor;
    uniform float uOpacity;

    void main () {
        gl_FragColor = vec4(uColor, uOpacity);
    }`,
    uniforms
  );

  const mesh = new PIXI.Mesh(geometry, shader, null, PIXI.DRAW_MODES.TRIANGLES);

  const update = ({
    align: newAlign,
    color: newColor,
    opacity: newOpacity,
    width: newWidth,
    height: newHeight,
    size: newSize
  } = {}) => {
    if (newAlign !== undefined) setAlign(newAlign);
    if (newColor !== undefined) setColor(newColor);
    if (newOpacity !== undefined) setOpacity(newOpacity);
    if (newWidth !== undefined) setWidth(newWidth);
    if (newHeight !== undefined) setHeight(newHeight);
    if (newSize !== undefined) setSize(newSize);

    uniforms.uniforms.uColor = color;
    uniforms.uniforms.uOpacity = opacity;

    mesh.geometry.getBuffer('aVertexPosition').update(updatedVertices());
  };

  if (initialOptions !== undefined) update(initialOptions);

  return pipe(
    withConstructor(createBorder),
    withStaticProperty('displayObject', mesh),
    withForwardedMethod('destroy', mesh.destroy)
  )({
    update
  });
};

export default createBorder;
