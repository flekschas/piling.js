import { createWorker } from '@flekschas/utils';
import workerFn from './google-quickdraw-cover-aggregator-worker';

const createGoogleQuickDrawCoverAggregator = ({
  size = 64,
  lineWidth = 2,
  log = false
} = {}) => items =>
  new Promise((resolve, reject) => {
    const worker = createWorker(workerFn);

    worker.onmessage = e => {
      if (e.data.error) reject(e.data.error);
      else resolve(e.data.rgba);
      worker.terminate();
    };

    worker.postMessage({
      lineWidth,
      items,
      size,
      log
    });
  });

export default createGoogleQuickDrawCoverAggregator;
