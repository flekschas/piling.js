/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  let umap;

  const error = (message) => ({ error: new Error(message) });

  const create = (umapUrl, config) => {
    importScripts(umapUrl);
    umap = new self.UMAP(config);
  };

  const fit = (data, labels) => {
    if (labels) umap.setSupervisedProjection(labels);
    return umap.fit(data);
  };

  const transform = (data) => umap.transform(data);

  self.onmessage = function onmessage(e) {
    switch (e.data.task) {
      case 'create':
        create(e.data.umapUrl, e.data.config);
        break;

      case 'fit':
        self.postMessage(fit(e.data.data, e.data.labels));
        break;

      case 'transform':
        self.postMessage(transform(e.data.data));
        break;

      default:
        self.postMessage(error('Unknown or no task specified'));
        break;
    }
  };
};

export default worker;
