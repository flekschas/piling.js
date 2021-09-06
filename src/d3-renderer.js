import { isFunction } from '@flekschas/utils';

import createSvgRenderer from './svg-renderer';

export const createD3Renderer = (render, options) => {
  const svgRenderer = createSvgRenderer(options);

  return (itemSources) =>
    svgRenderer(
      itemSources.map((itemSrc) => {
        const output = render(itemSrc);

        return isFunction(output.node) ? output.node() : output;
      })
    );
};

export default createD3Renderer;
