import { assign } from '@flekschas/utils';

const withClone = (...args) => (self) =>
  assign(self, {
    clone() {
      return self.constructor(...args);
    },
  });

export default withClone;
