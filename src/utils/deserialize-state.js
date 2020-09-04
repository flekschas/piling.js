const reviver = (key, value) => {
  switch (value) {
    case 'Infinity':
      return Infinity;

    case '-Infinity':
      return -Infinity;

    default:
      return value;
  }
};

const deserializeState = (serializedState) =>
  JSON.parse(serializedState, reviver);

export default deserializeState;
