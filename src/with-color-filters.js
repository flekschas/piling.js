import { assign, sum } from '@flekschas/utils';
import * as PIXI from 'pixi.js';

import { colorToDecAlpha } from './utils';

const BRIGHTEN_FS = `
varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

void main(void){
    vec4 color;
    %forloop%
    gl_FragColor = vec4(color.rgb + (1.0 - color.rgb) * vColor.rgb * color.w, color.w);
}
`;

const BrightenTintBatchRenderer = PIXI.BatchPluginFactory.create({
  fragment: BRIGHTEN_FS,
});
PIXI.Renderer.registerPlugin('brighten-tint', BrightenTintBatchRenderer);

const INVERT_FS = `
varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

void main(void){
    vec4 color;
    %forloop%
    gl_FragColor = vColor * vec4(color.a - color.rgb, color.a);
}
`;

const InvertBatchRenderer = PIXI.BatchPluginFactory.create({
  fragment: INVERT_FS,
});
PIXI.Renderer.registerPlugin('invert', InvertBatchRenderer);

const withColorFilters = (sprite) => (self) => {
  let brightness = 0;

  return assign(self, {
    brightness(value) {
      brightness = value;

      if (value === 0) {
        sprite.tint = 0xffffff;
        sprite.pluginName = 'batch';
      } else {
        // eslint-disable-next-line no-param-reassign
        const rgbValue = parseInt((value < 0 ? 1 + value : value) * 255, 10);

        sprite.tint = sum(
          new Array(3)
            .fill()
            // eslint-disable-next-line no-bitwise
            .map((x, i) => rgbValue << (8 * (2 - i)))
        );

        sprite.pluginName = value < 0 ? 'batch' : 'brighten-tint';
      }
    },
    invert(value) {
      sprite.pluginName = value ? 'invert' : 'batch';
    },
    tint(value) {
      // If brightness and tint are assigned, brightness is preferred
      if (+brightness !== 0) return;

      const color =
        typeof value === 'undefined' || value === null
          ? 0xffffff // This will unset the tint
          : colorToDecAlpha(value, null)[0];

      sprite.tint = color;
    },
  });
};

export default withColorFilters;
