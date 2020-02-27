import { assign } from '@flekschas/utils';

const withSize = (sprite, width, height) => self =>
  assign(self, {
    get aspectRatio() {
      return sprite.width / sprite.height;
    },
    get height() {
      return sprite.height;
    },
    get originalHeight() {
      return width;
    },
    get size() {
      return Math.max(sprite.width, sprite.height);
    },
    get width() {
      return sprite.width;
    },
    get originalWidth() {
      return height;
    }
  });

export default withSize;
