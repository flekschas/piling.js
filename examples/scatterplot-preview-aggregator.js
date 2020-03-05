const createScatterplotPreviewAggregator = () => sources => {
  const newSrc = sources.map(source => ({
    region: source[0].region,
    year: source[0].year
  }));

  return Promise.resolve(newSrc);
};

export default createScatterplotPreviewAggregator;
