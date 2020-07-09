/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  const getPixelHistFromDrawings = ({ hist, size, items, lineWidth }) => {
    const n = items.length;
    items.forEach(({ src }) => {
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      for (let s = 0; s < src.length; s++) {
        const xPos = src[s][0];
        const yPos = src[s][1];
        ctx.moveTo((xPos[0] / 256) * size, (yPos[0] / 256) * size);
        for (let i = 0; i < xPos.length; i++) {
          ctx.lineTo((xPos[i] / 256) * size, (yPos[i] / 256) * size);
        }
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      const pixelValues = ctx.getImageData(0, 0, size, size).data;

      let j = 0;

      for (let i = 3; i < pixelValues.length; i += 4) {
        hist[j] += pixelValues[i] / 255 / n;
        j++;
      }
    });
  };

  const scaleLinearMaxToUint8 = (max, t) => (value) =>
    Math.min(255, Math.max(0, 255 - ((max - t(value)) / max) * 255));

  const toRgba = (data, { log = false } = {}) => {
    const rgba = new Uint8ClampedArray(data.length * 4);

    // const max = Math.max.apply(null, data);
    let max = -Infinity;
    for (let i = 0; i < data.length; i++) {
      max = max > data[i] ? max : data[i];
    }

    const scaleFactor = log ? (1 / max) * 9 : 1;
    const transformer = log ? (x) => Math.log10(x * scaleFactor + 1) : (x) => x;
    const scale = scaleLinearMaxToUint8(transformer(max), transformer);

    let j = 3; // We only need to populate the alpha values
    for (let i = 0; i < data.length; i++) {
      rgba[j] = scale(data[i]);
      j += 4;
    }

    return rgba;
  };

  self.onmessage = function onmessage(event) {
    if (!event.data.items.length) {
      self.postMessage({ error: new Error('No items provided') });
    }

    const hist = new Float32Array(event.data.size ** 2);

    try {
      getPixelHistFromDrawings({
        hist,
        size: event.data.size,
        items: event.data.items,
        lineWidth: event.data.lineWidth,
      });
    } catch (error) {
      self.postMessage({ error });
    }

    try {
      const rgba = toRgba(hist, { log: event.data.log });
      self.postMessage({ rgba }, [rgba.buffer]);
    } catch (error) {
      self.postMessage({ error });
    }
  };
};

export default worker;
