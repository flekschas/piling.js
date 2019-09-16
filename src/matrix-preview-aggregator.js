import { createWorker } from './utils';
import workerFn from './matrix-preview-aggregator-worker';

const createMatrixPreviewAggregator = (aggregagtor = 'mean') => sources => {
  console.log(workerFn.toString());
  const worker = createWorker(workerFn);

  const aggregatedSources = sources.map(
    src =>
      new Promise((resolve, reject) => {
        worker.onmessage = ({ newSrc, error }) => {
          console.log('newSrc', newSrc);
          if (error) reject(error);
          else resolve(newSrc);
        };
        console.log('hello', worker.postMessage);
        worker.postMessage({ src, aggregagtor });
      })
  );

  worker.terminate();

  return Promise.all(aggregatedSources);
};

export default createMatrixPreviewAggregator;
