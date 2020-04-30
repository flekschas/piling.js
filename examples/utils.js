// eslint-disable-next-line import/prefer-default-export
export const supportsWebGl2 = () =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl2');
    if (ctx) resolve();
    else reject(new Error('No WebGL2 support'));
  });
