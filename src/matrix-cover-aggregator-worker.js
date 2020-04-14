/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  const mean = (data, items, length) => {
    const n = items.length;
    for (let s = 0; s < n; s++) {
      for (let i = 0; i < length; i++) {
        data[i] += Math.max(0, items[s].src.data[i]) / n;
      }
    }
  };

  const variance = (data, items, length) => {
    const u = new Float32Array(data.length);
    mean(u, items);

    const n = items.length;

    for (let s = 0; s < n; s++) {
      for (let i = 0; i < length; i++) {
        data[i] += (items[s].src.data[i] - u[i]) ** 2 / n;
      }
    }
  };

  const std = (data, items, length) => {
    variance(data, items, length);
    for (let i = 0; i < length; i++) {
      data[i] = Math.sqrt(data[i]);
    }
  };

  self.onmessage = function onmessage(event) {
    const newSrc = {};

    if (!event.data.items.length) {
      self.postMessage({ error: new Error('No sources provided') });
    }

    let newData;
    let length;
    try {
      newSrc.shape = event.data.items[0].src.shape;
      newSrc.dtype = event.data.items[0].src.dtype;
      length = event.data.items[0].src.data.length;
      newData = new Float32Array(length);
    } catch (error) {
      self.postMessage({ error });
    }

    try {
      switch (event.data.aggregator) {
        case 'variance':
          variance(newData, event.data.items, length);
          break;

        case 'std':
          std(newData, event.data.items, length);
          break;

        case 'mean':
        default:
          mean(newData, event.data.items, length);
          break;
      }
      newSrc.data = newData;
    } catch (error) {
      self.postMessage({ error });
    }

    self.postMessage({ newSrc }, [newSrc.data.buffer]);
  };
};

export default worker;
