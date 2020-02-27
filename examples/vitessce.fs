export default `#version 300 es

precision highp float;

uniform sampler2D uTexSampler0;
uniform sampler2D uTexSampler1;
uniform vec3 uColors[2];
uniform vec2 uDomains[2];

in vec2 vTextureCoord;

out vec4 outColor;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  float colorValue0 = (texture(uTexSampler0, vTextureCoord).r - uDomains[0][0]) / uDomains[0][1];
  float colorValue1 = (texture(uTexSampler1, vTextureCoord).r - uDomains[1][0]) / uDomains[1][1];

  vec3 rgbCombo = vec3(0.0);
  vec3 hsvCombo = vec3(0.0);

  float colorValues[2] = float[2](colorValue0, colorValue1);

  for(int i = 0; i < 2; i++) {
    hsvCombo = vec3(uColors[i].xy, max(0.0, colorValues[i]));
    rgbCombo += hsv2rgb(hsvCombo);
  }

  outColor = vec4(rgbCombo, 1.0);
}
`;
