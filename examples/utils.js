import { debounce } from '@flekschas/utils';

export const supportsWebGl2 = () =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl2');
    if (ctx) resolve();
    else reject(new Error('No WebGL2 support'));
  });

export const createRequestIdleCallback = () => {
  if (window.requestIdleCallback) return window.requestIdleCallback;

  return fn => debounce(fn, 750);
};
