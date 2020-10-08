/**
 * SVG to PIXI texture converter
 * @param {string|object} svg - SVG string or DOM element to be converted
 * @return {object} Rendered texture
 */
const svgToImg = async (
  svg,
  { width = null, height = null, color = null, background = null } = {}
) => {
  let svgStr =
    typeof svg === 'string' || svg instanceof String
      ? svg
      : new XMLSerializer().serializeToString(svg);

  if (svgStr[0] !== '<') {
    // The SVG string might be a URL to an SVG image
    const response = await fetch(svgStr);
    svgStr = await response.text();
  }

  return new Promise((resolve, reject) => {
    const image = new Image();

    const colorStyle = color && `color: ${color}`;
    const backgroundStyle = background && `background: ${background}`;
    const styles = [colorStyle, backgroundStyle].filter((s) => s);
    const style = `style="${styles.join('; ')}"`;

    const widthAttr = width && `width="${width}"`;
    const heightAttr = height && `height="${height}"`;
    const attrs = [widthAttr, heightAttr].filter((s) => s).join(' ');

    // Remove potential `<?xml` and `<!DOCTYPE` definitions which cause an
    // error when being converted to base84 somehow
    svgStr = svgStr.substring(svgStr.indexOf('<svg'));
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
};

const createSvgRenderer = (options) => (sources) =>
  Promise.all(sources.map((src) => svgToImg(src, options)));

export default createSvgRenderer;
