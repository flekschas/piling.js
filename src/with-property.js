import { assign, capitalize, identity } from './utils';

const withProperty = (
  name,
  {
    initialValue = undefined,
    getter: customGetter,
    setter: customSetter,
    cloner = identity,
    transformer = identity,
    validator = identity
  } = {}
) => self => {
  let value = initialValue;

  const getter = customGetter ? () => customGetter() : () => cloner(value);

  const setter = customSetter
    ? newValue => customSetter(newValue)
    : newValue => {
        const transformedNewValue = transformer(newValue);
        value = validator(transformedNewValue) ? transformedNewValue : value;
      };

  return assign(self, {
    get [name]() {
      return getter();
    },
    [`set${capitalize(name)}`](newValue) {
      setter(newValue);
    }
  });
};

export default withProperty;
