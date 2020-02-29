import { assign } from '@flekschas/utils';

const withScale = (sprite, width, height) => self =>
  assign(self, {
    scale(scaleFactor) {
      self.scaleFactor = scaleFactor;
      sprite.width = width * scaleFactor;
      sprite.height = height * scaleFactor;
    }
  });

export default withScale;
