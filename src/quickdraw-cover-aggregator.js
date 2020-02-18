import { createWorker } from '@flekschas/utils';
import workerFn from './quickdraw-cover-aggregator-worker';

const createQuickDrawCoverAggregator = (size = 64) => sources => {
  const renderStroke = strokes => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
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

    const pixelValueOneChannel = [];

    for (let i = 3; i < pixelValues.length; i += 4) {
      pixelValueOneChannel.push(pixelValues[i]);
    }

    return pixelValueOneChannel;
  };

  const pixelSrc = sources.map(src => renderStroke(src));

  return new Promise((resolve, reject) => {
    const worker = createWorker(workerFn);

    worker.onmessage = e => {
      if (e.data.error) reject(e.data.error);
      else resolve(e.data.newSrc);
      worker.terminate();
    };

    worker.postMessage({
      sources: pixelSrc,
      size
    });
  });
};

export default createQuickDrawCoverAggregator;
