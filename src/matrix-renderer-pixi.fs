export default `#version 300 es

precision mediump float;

uniform sampler2D uDataTex;
uniform sampler2D uColorMapTex;
uniform float uColorMapTexRes;
uniform float uMinValue;
uniform float uMaxValue;

in vec2 vTextureCoord;

out vec4 outColor;

vec3 toColor(float value) {
  // Linear index into the colormap, e.g., 5 means the 5th color
  float linIdx = (value - uMinValue) / uMaxValue * uColorMapTexRes * uColorMapTexRes;
  // Texture index into the colormap texture
  vec2 colorTexIndex = vec2(
    (mod(linIdx, uColorMapTexRes) / uColorMapTexRes),
    (floor(linIdx / uColorMapTexRes) / uColorMapTexRes)
  );
  return texture(uColorMapTex, colorTexIndex).xyz;
}

void main() {
  outColor = vec4(toColor(texture(uDataTex, vTextureCoord).r), 1.0);
}
`;
