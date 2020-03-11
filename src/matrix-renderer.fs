export default `#version 300 es

precision mediump float;

uniform sampler2D uDataTex;
uniform sampler2D uColorMapTex;
uniform float uColorMapTexRes;
uniform float uColorMapSize;
uniform float uMinValue;
uniform float uMaxValue;

in vec2 vTextureCoord;

out vec4 outColor;

vec4 toColor(float value) {
  float halfTexel = 0.5 / uColorMapTexRes;

  // Normalize value
  float normValue = clamp(
    (value - uMinValue) / (uMaxValue - uMinValue),
    0.0,
    1.0
  );

  // Linear index into the colormap, e.g., 5 means the 5th color
  float linIdx = max(normValue * uColorMapSize, float(value > 0.0));

  // Texture index into the colormap texture
  vec2 colorTexIndex = vec2(
    (mod(linIdx, uColorMapTexRes) / uColorMapTexRes) + halfTexel,
    (floor(linIdx / uColorMapTexRes) / uColorMapTexRes) + halfTexel
  );

  return texture(uColorMapTex, colorTexIndex);
}

void main() {
  outColor = toColor(texture(uDataTex, vTextureCoord).r);
}
`;
