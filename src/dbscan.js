import { createWorker } from '@flekschas/utils';

import workerFn from './dbscan-worker';

const createDbscan = ({
  distanceFunction = null,
  maxDistance = null,
  minPoints = 2,
  valueGetter = null
} = {}) => {
  const scripts = [];

  if (valueGetter) {
    scripts.push(
      window.URL.createObjectURL(
        new Blob(
          [`(() => { self.valueGetter = ${valueGetter.toString()}; })();`],
          {
            type: 'text/javascript'
          }
        )
      )
    );
  }

  if (distanceFunction) {
    scripts.push(
      window.URL.createObjectURL(
        new Blob(
          [
            `(() => { self.distanceFunction = ${distanceFunction.toString()}; })();`
          ],
          {
            type: 'text/javascript'
          }
        )
      )
    );
  }

  return items =>
    new Promise((resolve, reject) => {
      const worker = createWorker(workerFn);

      worker.onmessage = e => {
        if (e.data.error) reject(e.data.error);
        else resolve(e.data);

        worker.terminate();
      };

      worker.postMessage({
        maxDistance,
        minPoints,
        items,
        scripts
      });
    });
};

export default createDbscan;
