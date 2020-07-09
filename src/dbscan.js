import { createWorker } from '@flekschas/utils';

import workerFn from './dbscan-worker';

import createUrlScript from './utils/create-url-script';

const createDbscan = ({
  distanceFunction = null,
  maxDistance = null,
  minPoints = 2,
  valueGetter = null,
  postProcessing = null,
} = {}) => {
  const scripts = [];

  if (valueGetter) {
    scripts.push(
      createUrlScript(
        `(() => { self.valueGetter = ${valueGetter.toString()}; })();`
      )
    );
  }
  if (distanceFunction) {
    scripts.push(
      createUrlScript(
        `(() => { self.distanceFunction = ${distanceFunction.toString()}; })();`
      )
    );
  }
  if (postProcessing) {
    scripts.push(
      createUrlScript(
        `(() => { self.postProcessing = ${postProcessing.toString()}; })();`
      )
    );
  }

  return (items) =>
    new Promise((resolve, reject) => {
      const worker = createWorker(workerFn);

      worker.onmessage = (e) => {
        if (e.data.error) reject(e.data.error);
        else resolve(e.data);

        worker.terminate();
      };

      worker.postMessage({
        maxDistance,
        minPoints,
        items,
        scripts,
      });
    });
};

export default createDbscan;
