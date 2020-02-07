import { assign } from '@flekschas/utils';

import { colorToDecAlpha } from './utils';

const withTint = sprite => self =>
  assign(self, {
    tint(value) {
      const color =
        typeof value === 'undefined' || value === null
          ? 0xffffff // This will unset the tint
          : colorToDecAlpha(value, null)[0];

      sprite.tint = color;
    }
  });

export default withTint;
