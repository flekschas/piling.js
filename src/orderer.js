const creatOrderer = () => {
  // The default row-major order
  const rowMajor = cols => index => [index % cols, Math.floor(index / cols)];

  return {
    rowMajor
  };
};

export default creatOrderer;
