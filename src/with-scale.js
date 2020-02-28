import { assign } from '@flekschas/utils';

const withScale = sprite => self =>
  assign(self, {
    scale(scaleFactor) {
      self.scaleFactor = scaleFactor;
      sprite.width = sprite.texture.width * scaleFactor;
      sprite.height = sprite.texture.height * scaleFactor;
    }
  });

export default withScale;
