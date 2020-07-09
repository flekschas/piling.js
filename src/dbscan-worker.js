/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  const error = (message) => ({ error: new Error(message) });

  const identity = (x) => x;

  const l2DistDim = (dim) => {
    const body = Array(dim)
      .fill()
      .map((_, i) => `s += (v[${i}] - w[${i}]) ** 2;`)
      .join(' ');
    // eslint-disable-next-line no-new-func
    return new Function('v', 'w', `let s = 0; ${body} return Math.sqrt(s);`);
  };

  // From dbscanjs
  const rangeQuery = (points, q, dist, eps) =>
    points.filter((p) => dist(p.datum, q.datum) <= eps);

  const dbscan = (data, dist, eps, minPts) => {
    let cluster = 0;
    let neighbors = 0;
    let seeds;

    const points = data.map((datum, idx) => ({
      idx,
      datum,
      label: -1,
    }));

    points.forEach((point) => {
      // Only process unlabelled points
      if (point.label !== -1) return;

      // Get all the points neighbors
      neighbors = rangeQuery(points, point, dist, eps);

      // Check if point is noise
      if (neighbors.length < minPts) {
        point.label = 0;
        return;
      }

      cluster += 1; // Next cluster label
      point.label = cluster; // Label initial point

      // Remove point p from n
      seeds = neighbors.filter((neighbor) => neighbor.idx !== point.idx);

      // Process every seed point
      while (seeds.length) {
        const seed = seeds.pop();

        if (seed.label === 0) seed.label = cluster; // Change noise to border
        // eslint-disable-next-line no-continue
        if (seed.label !== -1) continue; // Previously processed
        seed.label = cluster; // Label neighbor

        // Find neighbors
        neighbors = rangeQuery(points, seed, dist, eps);

        // Add new neighbors to seed
        if (neighbors.length >= minPts) seeds = seeds.concat(neighbors);
      }
    });

    return points.map((p) => p.label - 1);
  };

  self.onmessage = function onmessage(event) {
    const { minPoints, items, scripts } = event.data;

    // Import the skmeans
    try {
      scripts.forEach((scriptUrl) => {
        importScripts(scriptUrl);
      });
    } catch (err) {
      self.postMessage(error(`Failed to import skmeans: ${err}`));
    }

    // Get the data from the items
    let data;
    try {
      data = items.map(self.valueGetter || identity);
    } catch (err) {
      self.postMessage(error(`Failed to load features: ${err}`));
    }

    const dist = self.distanceFunction
      ? self.distanceFunction
      : l2DistDim(data[0].length);

    let maxDistance = event.data.maxDistance;
    try {
      if (maxDistance === null) {
        const extrema = data.reduce(
          (_extrema, v) =>
            v.map((x, i) => [
              Math.min(x, _extrema[i][0]),
              Math.max(x, _extrema[i][1]),
            ]),
          Array(data.length)
            .fill()
            .map(() => [Infinity, -Infinity])
        );
        const minSize = extrema.reduce(
          (min, minMax) => Math.min(min, minMax[1] - minMax[0]),
          Infinity
        );
        maxDistance = 0.1 * minSize;
      }
    } catch (err) {
      self.postMessage(error(`Failed to determine max distance: ${err}`));
    }

    try {
      // Run dbscan
      const labels = dbscan(data, dist, maxDistance, minPoints || 2);

      const postProcessing =
        self.postProcessing && self.postProcessing(labels, data, items);

      self.postMessage({
        labels,
        postProcessing,
      });

      self.postMessage({ labels });
    } catch (err) {
      self.postMessage(error(`Failed to run dbscan: ${err}`));
    }
  };
};

export default worker;
