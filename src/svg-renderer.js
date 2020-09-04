/**
 * SVG to PIXI texture converter
 * @param {string|object} svg - SVG string or DOM element to be converted
 * @return {object} Rendered texture
 */
const svgToImg = (
  svg,
  { width = null, height = null, color = null, background = null } = {}
) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    let svgStr =
      typeof svg === 'string' || svg instanceof String
        ? svg
        : new XMLSerializer().serializeToString(svg);

    const colorStyle = color && `color: ${color}`;
    const backgroundStyle = background && `background: ${background}`;
    const styles = [colorStyle, backgroundStyle].filter((s) => s);
    const style = `style="${styles.join('; ')}"`;

    const widthAttr = width && `width="${width}"`;
    const heightAttr = height && `height="${height}"`;
    const attrs = [widthAttr, heightAttr].filter((s) => s).join(' ');

    svgStr = `${svgStr.slice(0, 5)} ${attrs} ${style} ${svgStr.slice(5)}`;

    // convert SVG string to base64
    const image64 = `data:image/svg+xml;base64,${btoa(svgStr)}`;

    image.onload = () => {
      resolve(image);
    };
    image.onerror = (error) => {
      reject(error);
    };

    image.src = image64;
  });

const createSvgRenderer = (options) => (sources) =>
  Promise.all(sources.map((src) => svgToImg(src, options)));

export default createSvgRenderer;
