import * as PIXI from 'pixi.js';
// import { scaleLinear } from 'd3-scale';

// let min = Infinity;
// let max = 0;

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
    // const maxBorder = Math.max(image.width, image.height);
    // if(maxBorder > max) max = maxBorder;
    // if(maxBorder < min) min = maxBorder;
  });

// const x = scaleLinear()
//   .domain([min, max])
//   .range([32, 64]);

// x.clamp(true);

const renderImage = image => {
  const texture = PIXI.Texture.from(image);
  const sprite = new PIXI.Sprite(texture);
  // const scale = texture.height / texture.width;
  // if(texture.width > texture.height) {
  //   sprite.width = x(texture.width);
  //   sprite.height = sprite.width * scale;
  // } else {
  //   sprite.height = x(texture.height);
  //   sprite.width = sprite.height / scale;
  // }
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
