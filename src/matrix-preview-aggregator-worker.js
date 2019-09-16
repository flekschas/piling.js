/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  self.onmessage = function onmessage({ src }) {
    const newSrc = Object.assign({}, src);

    try {
      const newData = new Float32Array(src.shape[0]);

      for (let i = 0; i < src.shape[0]; i++) {
        for (let j = 0; j < src.shape[1]; j++) {
          newData[i] += src.data[i * src.shape[0] + j] / src.shape[1];
        }
      }

      newSrc.data = newData;
    } catch (error) {
      self.postMessage({ error });
    }

    self.postMessage({ src }, [newSrc.data.buffer]);
  };
};

export default worker;
