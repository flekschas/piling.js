export default `#version 300 es

precision mediump float;

uniform sampler2D uDataTex;
uniform sampler2D uColorMapTex;
uniform float uColorMapTexRes;
uniform float uMinValue;
uniform float uMaxValue;

in vec2 vTextureCoord;

out vec4 outColor;

vec4 toColor(float value) {
  // Normalize value
  float normValue = (value - uMinValue) / (uMaxValue - uMinValue);

  // Linear index into the colormap, e.g., 5 means the 5th color
  float linIdx = max(
    normValue * uColorMapTexRes * uColorMapTexRes,
    float(value > 0.0)
  );

  // Texture index into the colormap texture
  vec2 colorTexIndex = vec2(
    (mod(linIdx, uColorMapTexRes) / uColorMapTexRes),
    (floor(linIdx / uColorMapTexRes) / uColorMapTexRes)
  );

  return texture(uColorMapTex, colorTexIndex);
}

void main() {
  outColor = toColor(texture(uDataTex, vTextureCoord).r);
}
`;
