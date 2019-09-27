import * as PIXI from 'pixi.js';

/**
 * Promised-based image loading
 * @param   {string}  src  Remote image source, i.e., a URL
 * @return  {object}  Promise resolving to the image once its loaded
 */
export const loadImage = (src, isCrossOrigin = false) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    if (isCrossOrigin) image.crossOrigin = 'Anonymous';
    image.onload = () => {
      resolve(image);
    };
    image.onerror = error => {
      reject(error);
    };
    image.src = src;
  });

const renderImage = image => PIXI.Texture.from(image);

const createImageRenderer = () => sources =>
  Promise.all(
    sources.map(src => {
      const isCrossOrigin = true;
      return loadImage(src, isCrossOrigin).then(image => renderImage(image));
    })
  );

export default createImageRenderer;
