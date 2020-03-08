/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  const error = message => ({ error: new Error(message) });

  const identity = x => x;

  const l2DistDim = dim => {
    const body = Array(dim)
      .fill()
      .map((_, i) => `d = v[${i}] - w[${i}]; s += d * d;`)
      .join(' ');
    // eslint-disable-next-line no-new-func
    return new Function('v', 'w', `let s = 0; let d; ${body} return s;`);
  };

  self.onmessage = function onmessage(event) {
    const {
      distanceFunction,
      initialization,
      k,
      maxIterations,
      items,
      scripts
    } = event.data;

    // Import the skmeans
    try {
      scripts.forEach(scriptUrl => {
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

    if (data.length <= k) {
      self.postMessage({ selectedItemIdxs: items.map((_, i) => i) });
    } else {
      try {
        // Run k-means++
        const results = self.skmeans(
          data,
          k,
          initialization || 'kmpp',
          maxIterations || 1000 * Math.log10(data.length),
          distanceFunction
        );

        // Determine center
        const dist = l2DistDim(data[0].length);
        const selectedItemIdxs = Array(k).fill();
        const minDist = Array(k).fill(Infinity);

        data.forEach((datum, i) => {
          const centroidIdx = results.idxs[i];
          const d = dist(datum, results.centroids[centroidIdx]);
          if (d < minDist[centroidIdx]) {
            minDist[centroidIdx] = d;
            selectedItemIdxs[centroidIdx] = i;
          }
        });

        self.postMessage({ selectedItemIdxs });
      } catch (err) {
        self.postMessage(error(`Failed to run k-means++: ${err}`));
      }
    }
  };
};

export default worker;
