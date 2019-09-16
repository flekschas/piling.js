import createWorker from './utils';
import workerFn from './matrix-preview-aggregator-worker';

const aggregate = sources => {
  const worker = createWorker(workerFn);

  const aggregatedSources = sources.map(
    src =>
      new Promise((resolve, reject) => {
        worker.onmessage = ({ newSrc, error }) => {
          if (error) reject(error);
          else resolve(newSrc);
        };
        worker.postMessage(src);
      })
  );

  worker.terminate();

  return Promise.all(aggregatedSources);
};

export default aggregate;
