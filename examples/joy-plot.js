import { line } from 'd3-shape';
import createPilingJs from '../src/library';
import { createSvgRenderer } from '../src/renderer';

const createSvgLinesPiles = async element => {
  const response = await fetch('data/monthly_density_avg_temp.json');
  const data = await response.json();

  const { width } = element.getBoundingClientRect();

  const columns = 12;
  const relHeight = 0.4;
  const absHeight = 100 * relHeight;
  const aspectRatio = 1 / relHeight;
  const itemWidth = (width / columns) * 3;
  const itemHeight = itemWidth * relHeight;

  const svgRenderer = createSvgRenderer({
    width: itemWidth,
    height: itemHeight,
    color: '#ccc'
  });
  const numBins = data[0][0].length;
  const barWidth = 100 / numBins;
  const barHalf = barWidth / 2;

  const createSvgStart = () =>
    `<svg viewBox="0 0 100 ${absHeight}" xmlns="http://www.w3.org/2000/svg">`;

  const createSvgEnd = () => '</svg>';

  const createLine = line()
    .x((_, i) => barHalf + barWidth * i)
    .y(d => absHeight - absHeight * d);

  const createPath = (
    kde,
    { stroke = 'black', fill = 'currentColor' } = {}
  ) => {
    const path = createLine(kde);
    return `<path d="M${absHeight},0${path}M${absHeight},${absHeight}L" stroke="${stroke}" stroke-size="1" fill="${fill}"/>`;
  };

  // prettier-ignore
  const createLinePlot = (hist) => [
    createSvgStart(),
    createPath(hist),
    createSvgEnd()
  ].join('');

  const startYear = 1948;
  const numYearPerStep = 5;

  const items = data.flatMap((kdes, month) => {
    return kdes.map((kde, halfDecade) => ({
      kde,
      src: createLinePlot(kde),
      years: `From ${startYear + numYearPerStep * halfDecade}-${startYear +
        numYearPerStep * (halfDecade + 1)}`,
      month,
      halfDecade
    }));
  });

  const piling = createPilingJs(element, {
    cellAspectRatio: aspectRatio,
    cellPadding: 5,
    renderer: svgRenderer,
    items,
    columns: 12,
    pileItemOffset: [-1, 5],
    pileItemBrightness: (_, i, pile) =>
      Math.min(0.5, 0.01 * (pile.items.length - i - 1)),
    pileBackgroundColor: 'rgba(255, 255, 255, 0.66)',
    pileScale: pile => 1 + Math.min(1.0, (pile.items.length - 1) * 0.1),
    backgroundColor: '#ffffff',
    lassoFillColor: '#000000',
    lassoStrokeColor: '#000000',
    showGrid: true
  });

  return piling;
};

export default createSvgLinesPiles;
