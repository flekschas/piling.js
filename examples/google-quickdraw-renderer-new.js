import { createWorker } from '@flekschas/utils';
import * as PIXI from 'pixi.js';
import workerFn from './google-quickdraw-renderer-worker';

const createGoogleQuickDrawRenderer = (size = 64) => sources => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const offscreen = canvas.transferControlToOffscreen();
  const worker = createWorker(workerFn);

  worker.postMessage({ canvas: offscreen }, [offscreen]);

  return new Promise((resolve, reject) => {
    const textures = [];
    sources.forEach(src => {
      worker.onmessage = e => {
        if (e.data.error) reject(e.data.error);
        else {
          textures.push(PIXI.Texture.fromBuffer(e.data.pixels, size, size));
          if (textures.length === sources.length) {
            worker.terminate();
            resolve(textures);
          }
        }
      };

      worker.postMessage({ src, size });
    });
  });
};

export default createGoogleQuickDrawRenderer;
