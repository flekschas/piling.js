/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  const error = (message) => ({ error: new Error(message) });

  const identity = (x) => x;

  self.onmessage = function onmessage(event) {
    const { initialization, k, maxIterations, items, scripts } = event.data;

    // Import the skmeans
    try {
      scripts.forEach((scriptUrl) => {
        importScripts(scriptUrl);
      });
    } catch (err) {
      self.postMessage(error(`Failed to import skmeans: ${err}`));
      return;
    }

    // Get the data from the items
    let data;
    try {
      data = items.map(self.valueGetter || identity);
    } catch (err) {
      self.postMessage(error(`Failed to load features: ${err}`));
      return;
    }

    if (data.length <= k) {
      self.postMessage(error(`Need at least ${k} items!`));
    } else {
      try {
        // Run k-means++
        const results = self.skmeans(
          data,
          k,
          initialization || 'kmpp',
          maxIterations || 1000 * Math.log10(data.length),
          self.distanceFunction || null
        );

        const postProcessing =
          self.postProcessing && self.postProcessing(results, data, items);

        self.postMessage({
          centroids: results.centroids,
          labels: results.idxs,
          postProcessing,
        });
      } catch (err) {
        self.postMessage(error(`Failed to run k-means++: ${err}`));
      }
    }
  };
};

export default worker;
