const createOrderer = () => {
  // The default row-major order
  const rowMajor = (cols) => (index) => [
    Math.floor(index / cols),
    index % cols,
  ];

  return {
    rowMajor,
  };
};

export default createOrderer;
