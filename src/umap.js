import { assign, pipe, withConstructor } from '@flekschas/utils';
import { UMAP } from 'umap-js';

const createUmap = (config = {}) => {
  const umap = new UMAP(config);

  const withPublicMethods = () => self =>
    assign(self, {
      // Same as SciKit Learn's `fit(X, y)`
      fit(data, labels = null) {
        if (labels !== null) umap.setSupervisedProjection(labels);
        return umap.fitAsync(data).then(() => self);
      },

      transform(data) {
        return umap.transform(data);
      }
    });

  return pipe(withPublicMethods(), withConstructor(createUmap))({});
};

export default createUmap;
