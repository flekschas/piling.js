import * as d3 from 'd3';
import { createSvgRenderer } from '../src/renderer';

import { DEFAULT_COLOR_RANGE } from './scatterplot-renderer';

const createScatterplotPreviewRenderer = ({
  width = 20,
  height = 60,
  color: colorProp = 'region',
  colorRange = DEFAULT_COLOR_RANGE
} = {}) => {
  const svgRenderer = createSvgRenderer({ width, height });

  const createColorMap = domain =>
    d3
      .scaleOrdinal()
      .domain(domain)
      .range(colorRange);

  const renderPreview = color => {
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`);

    svg
      .append('g')
      .append('rect')
      .attr('fill', color)
      .attr('width', width)
      .attr('height', height);

    return svg.node();
  };

  const renderer = async sources => {
    const colorDomain = sources.map(source => source[colorProp]);
    const colorMap = createColorMap(colorDomain);

    const svgSources = sources.map(source => {
      const color = colorMap(source[colorProp]);
      return renderPreview(color);
    });

    return svgRenderer(svgSources);
  };

  return {
    renderer
  };
};

export default createScatterplotPreviewRenderer;
