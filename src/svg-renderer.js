import * as PIXI from 'pixi.js';

/**
 * SVG to PIXI texture converter
 * @param {string|object} svg - SVG string or DOM element to be converted
 * @return {object} Rendered texture
 */
const renderSvg = (
  svg,
  { width = null, height = null, color = null, background = null } = {}
) => {
  let svgStr =
    typeof svg === 'string' || svg instanceof String
      ? svg
      : new XMLSerializer().serializeToString(svg);

  const widthAttr = width && `width="${width}"`;
  const heightAttr = height && `height="${height}"`;
  const attrs = [widthAttr, heightAttr].filter(s => s).join(' ');

  const colorStyle = color && `color: ${color}`;
  const backgroundStyle = background && `background: ${background}`;
  const styles = [colorStyle, backgroundStyle].filter(s => s);
  const style = `style="${styles.join('; ')}"`;

  svgStr = `${svgStr.slice(0, 5)} ${attrs} ${style} ${svgStr.slice(5)}`;

  return PIXI.Texture.from(svgStr);
};

const createSvgRenderer = options => sources =>
  Promise.all(sources.map(src => renderSvg(src, options)));

export default createSvgRenderer;
