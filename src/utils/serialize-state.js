const replacer = (key, value) => {
  switch (value) {
    case Infinity:
      return 'Infinity';

    case -Infinity:
      return '-Infinity';

    default:
      return value;
  }
};

const serializeState = (state) => JSON.stringify(state, replacer);

export default serializeState;
