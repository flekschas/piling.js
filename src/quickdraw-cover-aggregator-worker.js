/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  const getPixelsFromStrokes = (pixels, size, strokes, total) => {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    for (let s = 0; s < strokes.length; s++) {
      const xPos = strokes[s][0];
      const yPos = strokes[s][1];
      ctx.moveTo((xPos[0] / 256) * size, (yPos[0] / 256) * size);
      for (let i = 0; i < xPos.length; i++) {
        ctx.lineTo((xPos[i] / 256) * size, (yPos[i] / 256) * size);
      }
      ctx.stroke();
    }

    const pixelValues = ctx.getImageData(0, 0, size, size).data;

    let j = 0;
    for (let i = 3; i < pixelValues.length; i += 4) {
      pixels[j] += pixelValues[i] / 255 / total;
      j++;
    }
  };

  const createHist = (hist, size, sources) => {
    sources.forEach((src, i) => {
      getPixelsFromStrokes(hist, size, src, sources.length, i === 0);
    });
  };

  const scaleLinearMaxToUint8 = domainMax => value =>
    Math.min(255, Math.max(0, 255 - ((domainMax - value) / domainMax) * 255));

  const toRgba = data => {
    const rgba = new Uint8ClampedArray(data.length * 4);

    const max = Math.max.apply(null, data);

    const scale = scaleLinearMaxToUint8(max);

    let j = 3; // We only need to populate the alpha values
    for (let i = 0; i < data.length; i++) {
      rgba[j] = scale(data[i]);
      j += 4;
    }

    return rgba;
  };

  self.onmessage = function onmessage(event) {
    const numSources = event.data.sources.length;

    if (!numSources) {
      self.postMessage({ error: new Error('No sources provided') });
    }

    const hist = new Float32Array(event.data.size ** 2);

    try {
      createHist(hist, event.data.size, event.data.sources);
    } catch (error) {
      self.postMessage({ error });
    }

    try {
      const rgba = toRgba(hist);
      self.postMessage({ rgba }, [rgba.buffer]);
    } catch (error) {
      self.postMessage({ error });
    }
  };
};

export default worker;
