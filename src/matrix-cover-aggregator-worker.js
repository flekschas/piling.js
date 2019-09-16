/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  const mean = (data, sources, length) => {
    const n = sources.length;
    for (let s = 0; s < n; s++) {
      for (let i = 0; i < length; i++) {
        data[i] += sources[s].data[i] / n;
      }
    }
  };

  const variance = (data, sources, length) => {
    const u = new Float32Array(data.length);
    mean(u, sources);

    const n = sources.length;

    for (let s = 0; s < n; s++) {
      for (let i = 0; i < length; i++) {
        data[i] += (sources[s].data[i] - u[i]) ** 2 / n;
      }
    }
  };

  const std = (data, sources, length) => {
    variance(data, sources, length);
    for (let i = 0; i < length; i++) {
      data[i] = Math.sqrt(data[i]);
    }
  };

  self.onmessage = function onmessage(event) {
    const newSrc = {};

    const numSources = event.sources.length;

    if (!numSources) {
      self.postMessage({ error: new Error('No sources provided') });
    }

    let newData;
    let length;
    try {
      newSrc.shape = event.sources[0].shape;
      newSrc.dtype = event.sources[0].dtype;
      length = event.sources[0].data.length;
      newData = new Float32Array(length);
    } catch (error) {
      self.postMessage({ error });
    }

    try {
      switch (event.aggregator) {
        case 'variance':
          variance(newData, event.sources, length);
          break;

        case 'std':
          std(newData, event.sources, length);
          break;

        case 'mean':
        default:
          mean(newData, event.sources, length);
          break;
      }
      newSrc.data = newData;
    } catch (error) {
      self.postMessage({ error });
    }

    self.postMessage({ src: newSrc });
  };
};

export default worker;
