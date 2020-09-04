import { createWorker } from '@flekschas/utils';
import skmeans from '../node_modules/skmeans/dist/browser/skmeans.min';

import workerFn from './kmeans-worker';

import createUrlScript from './utils/create-url-script';

const createKmeans = (
  k,
  {
    distanceFunction = null,
    initialization = 'kmpp',
    maxIterations = null,
    valueGetter = null,
    postProcessing = null,
  } = {}
) => {
  const scripts = [createUrlScript(skmeans.replace(/window/g, 'self'))];

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
        initialization,
        k,
        maxIterations,
        items,
        scripts,
      });
    });
};

export default createKmeans;
