import { createWorker } from '@flekschas/utils';
import workerFn from './matrix-cover-aggregator-worker';

const createMatrixCoverAggregator = (aggregator = 'mean') => (items) => {
  return new Promise((resolve, reject) => {
    const worker = createWorker(workerFn);

    worker.onmessage = (e) => {
      if (e.data.error) reject(e.data.error);
      else resolve(e.data.newSrc);
      worker.terminate();
    };

    worker.postMessage({
      items,
      aggregator,
    });
  });
};

export default createMatrixCoverAggregator;
