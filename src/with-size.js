import { assign } from '@flekschas/utils';

const withSize = (sprite, width, height) => (self) =>
  assign(self, {
    get aspectRatio() {
      return sprite.width / sprite.height;
    },
    get height() {
      return sprite.height;
    },
    get center() {
      return [sprite.width / 2, sprite.height / 2];
    },
    get originalHeight() {
      return height;
    },
    get size() {
      return Math.max(sprite.width, sprite.height);
    },
    get width() {
      return sprite.width;
    },
    get originalWidth() {
      return width;
    },
  });

export default withSize;
