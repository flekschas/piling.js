import { assign } from './utils';

const withReadOnlyProperty = (name, value) => self =>
  assign(self, {
    get [name]() {
      return value;
    }
  });

export default withReadOnlyProperty;
