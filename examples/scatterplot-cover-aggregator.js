import { createWorker } from '@flekschas/utils';
import workerFn from './scatterplot-cover-aggregator-worker';

const createScatterplotCoverAggregator = () => sources =>
  new Promise((resolve, reject) => {
    const worker = createWorker(workerFn);

    worker.onmessage = e => {
      if (e.data.error) reject(e.data.error);
      else resolve(e.data.newSrc);
      worker.terminate();
    };

    worker.postMessage({
      sources
    });
  });

export default createScatterplotCoverAggregator;
