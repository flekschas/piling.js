import { assign } from '@flekschas/utils';

const withDestroy = (displayObject) => (self) =>
  assign(self, {
    destroy() {
      displayObject.destroy({
        baseTexture: true,
        children: true,
        texture: true,
      });
    },
  });

export default withDestroy;
