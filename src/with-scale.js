import { assign } from '@flekschas/utils';

const withScale = (sprite, width, height) => (self) =>
  assign(self, {
    scale(scaleFactor) {
      self.scaleFactor = scaleFactor;
      self.scaleX(scaleFactor);
      self.scaleY(scaleFactor);
    },
    scaleX(scaleXFactor) {
      self.scaleXFactor = scaleXFactor;
      sprite.width = width * scaleXFactor;
    },
    scaleY(scaleYFactor) {
      self.scaleYFactor = scaleYFactor;
      sprite.height = height * scaleYFactor;
    },
  });

export default withScale;
