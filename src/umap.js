import { createWorker } from '@flekschas/utils';
import umapScriptStr from '../node_modules/umap-js/lib/umap-js.min';

import umapWorkerFn from './umap-worker';
import createScale from './utils/scale';
import createUrlScript from './utils/create-url-script';

const createUmap = (config, { padding = 0.1 } = {}) => {
  const xScale = createScale();
  const yScale = createScale();

  const umapUrl = createUrlScript(umapScriptStr.replace('window', 'self'));

  const umapWorker = createWorker(umapWorkerFn);
  umapWorker.postMessage({ task: 'create', config, umapUrl });

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const defineScales = (embedding) => {
    embedding.forEach((point) => {
      minX = point[0] < minX ? point[0] : minX;
      minY = point[1] < minY ? point[1] : minY;
      maxX = point[0] > maxX ? point[0] : maxX;
      maxY = point[1] > maxY ? point[1] : maxY;
    });

    // Some padding can be beneficial as piles keep moving around a little bit
    // every time they are transformed
    const xPad = (maxX - minX) * padding;
    const yPad = (maxY - minY) * padding;

    xScale.domain([minX - xPad, maxX + xPad]);
    yScale.domain([minY - yPad, maxY + yPad]);

    return embedding;
  };

  const scalePoint = (pt) => [xScale(pt[0]), yScale(pt[1])];

  const destroy = () => {
    umapWorker.terminate();
  };

  const fit = (data, labels = null) => {
    minX = Infinity;
    minY = Infinity;
    maxX = -Infinity;
    maxY = -Infinity;

    return new Promise((resolve) => {
      umapWorker.onmessage = (event) => {
        resolve(defineScales(event.data));
      };

      umapWorker.postMessage({
        task: 'fit',
        data,
        labels,
      });
    });
  };

  const transform = (data) => {
    if (!umapWorker)
      return Promise.reject(new Error('You need to fit data first!'));

    return new Promise((resolve) => {
      umapWorker.onmessage = (event) => {
        resolve(event.data.map(scalePoint));
      };

      umapWorker.postMessage({ task: 'transform', data });
    });
  };

  return {
    destroy,
    fit,
    transform,
  };
};

export default createUmap;
