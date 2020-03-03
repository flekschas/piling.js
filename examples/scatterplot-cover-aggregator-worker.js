/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  self.onmessage = function onmessage(event) {
    const numSources = event.data.sources.length;

    if (!numSources) {
      self.postMessage({ error: new Error('No sources provided') });
    }

    let newSrc;

    try {
      newSrc = event.data.sources.reduce(
        (newSource, source) => newSource.concat(source),
        []
      );
    } catch (error) {
      self.postMessage({ error });
    }

    self.postMessage({ newSrc });
  };
};

export default worker;
