const createScatterplotPreviewAggregator = () => sources => {
  const newSrc = sources.map(source => ({
    region: source.region,
    year: source.year
  }));

  return Promise.resolve(newSrc);
};

export default createScatterplotPreviewAggregator;
