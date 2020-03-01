import { assign } from '@flekschas/utils';

const withSize = sprite => self =>
  assign(self, {
    get aspectRatio() {
      return sprite.width / sprite.height;
    },
    get height() {
      return sprite.height;
    },
    get originalHeight() {
      return sprite.texture.height;
    },
    get size() {
      return Math.max(sprite.width, sprite.height);
    },
    get width() {
      return sprite.width;
    },
    get originalWidth() {
      return sprite.texture.width;
    }
  });

export default withSize;
