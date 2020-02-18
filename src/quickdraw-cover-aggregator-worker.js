/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  const scaleLinear = (domainMin, domainMax) => value =>
    Math.min(
      255,
      Math.max(0, 255 - ((domainMax - value) / (domainMax - domainMin)) * 255)
    );

  const normalizeImageData = (data, sources, length) => {
    const oneChannelData = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      for (let j = 0; j < sources.length; j++) {
        oneChannelData[i] += sources[j][i];
      }
      oneChannelData[i] /= 255;
    }

    const max = Math.max.apply(null, oneChannelData);
    const min = Math.min.apply(null, oneChannelData);

    const scale = scaleLinear(min, max);

    for (let i = 0; i < length; i++) {
      const j = i * 4;
      data[j] = 0;
      data[j + 1] = 0;
      data[j + 2] = 0;
      data[j + 3] = scale(oneChannelData[i]);
    }
  };

  self.onmessage = function onmessage(event) {
    const numSources = event.data.sources.length;

    if (!numSources) {
      self.postMessage({ error: new Error('No sources provided') });
    }

    const newSrc = new ImageData(event.data.size, event.data.size);
    let newData;
    let length;
    try {
      length = event.data.sources[0].length;
      newData = new Uint8ClampedArray(length * 4);
    } catch (error) {
      self.postMessage({ error });
    }

    try {
      normalizeImageData(newData, event.data.sources, length);
      newSrc.data = newData;
    } catch (error) {
      self.postMessage({ error });
    }

    self.postMessage({ newSrc });
  };
};

export default worker;
