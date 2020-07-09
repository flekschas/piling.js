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
    image.onerror = (error) => {
      console.error(`Could't load ${src}`);
      reject(error);
    };
    image.src = src;
  });

const createImageRenderer = () => (sources) =>
  Promise.all(
    sources.map((src) => {
      const isCrossOrigin = true;
      return loadImage(src, isCrossOrigin);
    })
  );

export default createImageRenderer;
