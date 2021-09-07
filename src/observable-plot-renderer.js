import createSvgRenderer from './svg-renderer';

export const createObservablePlotRenderer = (
  Plot,
  renderToMarks,
  options = {}
) => {
  const svgRenderer = createSvgRenderer(options);

  return (itemSources) =>
    svgRenderer(
      itemSources.map((itemSrc) =>
        Plot.plot({
          marks: renderToMarks(itemSrc),
          ...options,
        })
      )
    );
};

export default createObservablePlotRenderer;
