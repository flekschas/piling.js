const matchArrayPair = (oldArray = [], newArray = []) => {
  // eslint-disable-next-line no-param-reassign
  oldArray = new Set(oldArray);

  const newItems = [];
  const sameItems = newArray.filter((x) => {
    if (oldArray.has(x)) {
      oldArray.delete(x);
      return true;
    }

    newItems.push(x);

    return false;
  });
  const deletedItems = Array.from(oldArray);

  return [deletedItems, newItems, sameItems];
};

export default matchArrayPair;
