import { createWorker } from '@flekschas/utils';
import workerFn from './quickdraw-cover-aggregator-worker';

const createQuickDrawCoverAggregator = (size = 64) => sources =>
  new Promise((resolve, reject) => {
    const worker = createWorker(workerFn);

    worker.onmessage = e => {
      if (e.data.error) reject(e.data.error);
      else resolve(e.data.rgba);
      worker.terminate();
    };

    worker.postMessage({
      sources,
      size
    });
  });

export default createQuickDrawCoverAggregator;
