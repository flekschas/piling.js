import { createWorker } from '@flekschas/utils';
import skmeans from '../node_modules/skmeans/dist/browser/skmeans.min';

import workerFn from './representative-cover-aggregator-worker';

const createRepresentativeCoverAggregator = (
  k,
  {
    distanceFunction = null,
    initialCentroids = 'kmpp',
    maxIterations = null,
    valueGetter = null
  } = {}
) => {
  const skmeansUrl = window.URL.createObjectURL(
    new Blob([skmeans.replace(/window/g, 'self')], {
      type: 'text/javascript'
    })
  );
  const valueGetterUrl = window.URL.createObjectURL(
    new Blob([`(() => { self.valueGetter = ${valueGetter.toString()}; })();`], {
      type: 'text/javascript'
    })
  );

  return items =>
    new Promise((resolve, reject) => {
      const worker = createWorker(workerFn);

      worker.onmessage = e => {
        const selectedItemsSrcs = e.data.selectedItemIdxs.map(
          itemIndex => items[itemIndex].src
        );

        if (e.data.error) reject(e.data.error);
        else resolve(selectedItemsSrcs);

        worker.terminate();
      };

      worker.postMessage({
        distanceFunction,
        initialCentroids,
        k,
        maxIterations,
        items,
        scripts: [skmeansUrl, valueGetterUrl]
      });
    });
};

export default createRepresentativeCoverAggregator;
