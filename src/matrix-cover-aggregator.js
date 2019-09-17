import { createWorker } from './utils';
import workerFn from './matrix-cover-aggregator-worker';

const createMatrixCoverAggregator = (aggregagtor = 'mean') => sources => {
  return new Promise((resolve, reject) => {
    const worker = createWorker(workerFn);

    worker.onmessage = e => {
      if (e.data.error) reject(e.data.error);
      else resolve(e.data.newSrc);
      worker.terminate();
    };

    worker.postMessage({
      sources,
      aggregagtor
    });
  });
};

export default createMatrixCoverAggregator;
