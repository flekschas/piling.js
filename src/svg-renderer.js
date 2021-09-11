/**
 * SVG to PIXI texture converter
 * @param {string|object} svg - SVG string or DOM element to be converted
 * @return {object} Rendered texture
 */
const svgToImg = async (
  svg,
  { width = 128, height = 128, color = 'black', background = null } = {}
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
    svgStr = svgStr.slice(svgStr.indexOf('<svg'));
    const svgTagClosePos = svgStr.indexOf('>');
    let svgTag = svgStr.slice(0, svgTagClosePos + 1);

    // Remove existing `width` property if it exists
    const svgTagWidthPos = svgTag.indexOf('width="');
    if (svgTagWidthPos >= 0) {
      const svgTagWidthClosePos = svgTag.indexOf('"', svgTagWidthPos + 7);
      svgTag =
        svgTag.slice(0, svgTagWidthPos) + svgTag.slice(svgTagWidthClosePos + 1);
    }

    // Remove existing `height` property if it exists
    const svgTagHeightPos = svgTag.indexOf('height="');
    if (svgTagHeightPos >= 0) {
      const svgTagheightClosePos = svgTag.indexOf('"', svgTagHeightPos + 8);
      svgTag =
        svgTag.slice(0, svgTagHeightPos) +
        svgTag.slice(svgTagheightClosePos + 1);
    }

    // Remove existing `style` property if it exists
    const svgTagStylePos = svgTag.indexOf('style="');
    if (svgTagStylePos >= 0) {
      const svgTagStyleClosePos = svgTag.indexOf('"', svgTagStylePos + 7);
      svgTag =
        svgTag.slice(0, svgTagStylePos) + svgTag.slice(svgTagStyleClosePos + 1);
    }

    svgStr = [
      [svgTag.slice(0, 5), attrs, style, svgTag.slice(5)].join(' '),
      svgStr.slice(svgTagClosePos + 1),
    ].join('');

    // convert SVG string to base64
    const image64 = `data:image/svg+xml;base64,${btoa(
      unescape(encodeURIComponent(svgStr))
    )}`;

    image.onload = () => {
      resolve(image);
    };

    image.onerror = (error) => {
      error.message = 'SVG Renderer: Could not render SVG as an image.';
      reject(error);
    };

    image.src = image64;
  });
};

const createSvgRenderer = (options) => (sources) =>
  Promise.all(sources.map((src) => svgToImg(src, options)));

export default createSvgRenderer;
