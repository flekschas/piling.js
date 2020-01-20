import { assign } from './utils';

const withConstructor = constructor => self =>
  assign(self, {
    __proto__: {
      constructor
    }
  });

export default withConstructor;
