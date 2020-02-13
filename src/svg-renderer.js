import * as PIXI from 'pixi.js';

/**
 * Promised-based SVG to image converter
 * @param   {string|object}  svg  SVG string or DOM element to be converted
 * @return  {object}  Promise resolving to the image
 */
export const svgToImg = (
  svg,
  { width = null, height = null, background = null } = {}
) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    if (width !== null && height !== null) {
      image.width = width;
      image.height = height;
    }

    // serialize svg element into a string if needed
    let svgStr =
      typeof svg === 'string' || svg instanceof String
        ? svg
        : new XMLSerializer().serializeToString(svg);

    const style = background ? `style="background: ${background}"` : '';
    svgStr = `${svgStr.slice(0, 5)} ${style} ${svgStr.slice(5)}`;

    // convert SVG string to base64
    const image64 = `data:image/svg+xml;base64,${btoa(svgStr)}`;

    image.onload = () => {
      resolve(image);
    };
    image.onerror = error => {
      reject(error);
    };

    image.src = image64;
  });

const renderImage = image => PIXI.Texture.from(image);

const createSvgRenderer = options => sources =>
  Promise.all(
    sources.map(src => svgToImg(src, options).then(image => renderImage(image)))
  );

export default createSvgRenderer;
