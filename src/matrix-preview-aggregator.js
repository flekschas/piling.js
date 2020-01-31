import { createWorker } from '@flekschas/utils';
import workerFn from './matrix-preview-aggregator-worker';

const createMatrixPreviewAggregator = (aggregagtor = 'mean') => sources => {
  const aggregatedSources = sources.map(
    src =>
      new Promise((resolve, reject) => {
        const worker = createWorker(workerFn);

        worker.onmessage = e => {
          if (e.data.error) reject(e.data.error);
          else resolve(e.data.newSrc);
          worker.terminate();
        };
        worker.postMessage({ src, aggregagtor });
      })
  );

  return Promise.all(aggregatedSources).catch(error => {
    console.error('Matrix preview aggregation failed', error);
  });
};

export default createMatrixPreviewAggregator;
