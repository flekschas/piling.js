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

const renderImage = image => {
  const texture = PIXI.Texture.from(image);
  const sprite = new PIXI.Sprite(texture);

  // sprite.width = 56;
  // sprite.height = 56;
  // sprite.x = 0;
  // sprite.y = 0;

  return sprite;
};

const imageRenderer = src => {
  const isCrossOrigin = true;
  return new Promise((resolve, reject) => {
    loadImage(src, isCrossOrigin)
      .then(image => {
        resolve(renderImage(image));
      })
      .catch(error => {
        reject(error);
      });
  });
};

export default imageRenderer;
