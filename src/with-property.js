import { assign, capitalize, identity } from './utils';

const withProperty = (
  name,
  {
    initialValue = undefined,
    cloner = identity,
    transformer = identity,
    validator = identity
  } = {}
) => self => {
  let value = initialValue;
  return assign(self, {
    get [name]() {
      return cloner(value);
    },
    [`set${capitalize(name)}`](newValue) {
      const transformedNewValue = transformer(newValue);
      value = validator(transformedNewValue) ? transformedNewValue : value;
    }
  });
};

export default withProperty;
