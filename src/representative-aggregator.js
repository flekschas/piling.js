import createKmeans from './kmeans';

const createRepresentativeAggregator = (
  k,
  {
    distanceFunction = null,
    initialization = 'kmpp',
    maxIterations = null,
    valueGetter = null,
  } = {}
) => {
  const postProcessing = (results, data) => {
    const l2DistDim = (dim) => {
      const body = Array(dim)
        .fill()
        .map((_, i) => `s += (v[${i}] - w[${i}]) ** 2;`)
        .join(' ');
      // eslint-disable-next-line no-new-func
      return new Function('v', 'w', `let s = 0; ${body} return s;`);
    };

    // Determine center
    const dist = l2DistDim(data[0].length);
    const selectedItemIdxs = Array(results.centroids.length).fill();
    const minDist = Array(results.centroids.length).fill(Infinity);

    data.forEach((datum, i) => {
      const centroidIdx = results.idxs[i];
      const d = dist(datum, results.centroids[centroidIdx]);
      if (d < minDist[centroidIdx]) {
        minDist[centroidIdx] = d;
        selectedItemIdxs[centroidIdx] = i;
      }
    });

    return {
      selectedItemIdxs,
    };
  };

  const kmeans = createKmeans(k, {
    distanceFunction,
    initialization,
    maxIterations,
    valueGetter,
    postProcessing,
  });

  return (items) => {
    if (items.length <= k) return Promise.resolve(items.map((i) => i.src));

    return kmeans(items).then((response) => {
      return response.postProcessing.selectedItemIdxs.map(
        (itemIndex) => items[itemIndex].src
      );
    });
  };
};

export default createRepresentativeAggregator;
