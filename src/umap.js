import {
  assign,
  pipe,
  withReadOnlyProperty,
  withConstructor
} from '@flekschas/utils';
import { UMAP } from 'umap-js';

import { scaleLinear } from './utils';

const createUmap = (config, { padding = 0.1 } = {}) => {
  const umap = new UMAP(config);

  const xScale = scaleLinear();
  const yScale = scaleLinear();

  let runs = 0;
  let fitting;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const defineScales = embedding => {
    embedding.forEach(point => {
      minX = point[0] < minX ? point[0] : minX;
      minY = point[1] < minY ? point[1] : minY;
      maxX = point[0] > maxX ? point[0] : maxX;
      maxY = point[1] > maxY ? point[1] : maxY;
    });

    // Some padding can be benefition as piles keep moving around a little bit
    // every time they are transformed
    const xPad = (maxX - minX) * padding;
    const yPad = (maxY - minY) * padding;

    xScale.domain([minX - xPad, maxX + xPad]);
    yScale.domain([minY - yPad, maxY + yPad]);
  };

  const scalePoint = pt => [xScale(pt[0]), yScale(pt[1])];

  const withPublicMethods = () => self =>
    assign(self, {
      // Same as SciKit Learn's `fit(X, y)`
      fit(data, labels = null) {
        minX = Infinity;
        minY = Infinity;
        maxX = -Infinity;
        maxY = -Infinity;

        if (labels !== null) umap.setSupervisedProjection(labels);

        fitting = umap.fitAsync(data);
        fitting.then(embedding => {
          defineScales(embedding);
          runs++;
        });

        return fitting;
      },

      transform(data) {
        return umap.transform(data).map(scalePoint);
      }
    });

  return pipe(
    withReadOnlyProperty('fitting', () => fitting),
    withReadOnlyProperty('runs', () => runs),
    withPublicMethods(),
    withConstructor(createUmap)
  )({});
};

export default createUmap;
