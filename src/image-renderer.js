import * as PIXI from 'pixi.js';

/**
 * Promised-based image loading
 * @param   {string}  src  Remote image source, i.e., a URL
 * @return  {object}  Promise resolving to the image once its loaded
 */
export const loadImage = (src, isCrossOrigin = false) =>
  new Promise((accept, reject) => {
    const image = new Image();
    if (isCrossOrigin) image.crossOrigin = 'Anonymous';
    image.onload = () => {
      accept(image);
    };
    image.onerror = error => {
      reject(error);
    };
    image.src = src;
  });

const renderImage = image => {
  const texture = PIXI.Texture.from(image);
  const sprite = new PIXI.Sprite(texture);
  sprite.width = 36;
  sprite.height = 36;
  sprite.x = 10;
  sprite.y = 10;

  const graphics = new PIXI.Graphics();
  graphics.addChild(sprite);

  return graphics;
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
