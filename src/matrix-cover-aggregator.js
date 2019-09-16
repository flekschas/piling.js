import { createWorker } from './utils';
import workerFn from './matrix-cover-aggregator-worker';

const createMatrixCoverAggregator = (aggregagtor = 'mean') => sources => {
  const worker = createWorker(workerFn);

  return new Promise((resolve, reject) => {
    worker.onmessage = ({ newSrc, error }) => {
      if (error) reject(error);
      else resolve(newSrc);
    };

    worker.postMessage({
      sources,
      aggregagtor
    });

    worker.terminate();
  });
};

export default createMatrixCoverAggregator;
