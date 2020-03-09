import { line } from 'd3-shape';
import createPilingJs from '../src/library';
import { createSvgRenderer } from '../src/renderer';

const createSvgLinesPiles = async element => {
  const response = await fetch('data/monthly_temp_deviation_decades.json');
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

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  const createSvgStart = () =>
    `<svg viewBox="0 0 100 ${absHeight}" xmlns="http://www.w3.org/2000/svg">`;

  const createGradient = (name, startColor, midColor, endColor) => `<defs>
  <linearGradient id="${name}" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%"   stop-color="${startColor}"/>
    <stop offset="50%"  stop-color="${midColor}"/>
    <stop offset="100%" stop-color="${endColor}"/>
  </linearGradient>
</defs>`;

  const createSvgEnd = () => '</svg>';

  const createLine = line()
    .x((_, i) => barHalf + barWidth * i)
    .y(d => absHeight - absHeight * d);

  const createPath = kde => {
    const path = createLine(kde);
    return `<path d="M${absHeight},0${path}L100,${absHeight}L" stroke="url(#linear-stroke)" stroke-size="1" fill="url(#linear-fill)"/>`;
  };

  const createTitle = (titleLeft, titleRight) =>
    `<foreignObject x="0" y="0" width="100" height="8">
  <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; justify-content: space-between; font: 8px sans-serif; color: #808080">
    <span>${titleLeft}</span>
    <span>${titleRight}</span>
  </div>
</foreignObject>`;

  // prettier-ignore
  const createLinePlot = (hist, years, month) => [
    createSvgStart(),
    createGradient('linear-fill', '#3170ad', '#cccccc', '#c76526'),
    createGradient('linear-stroke', '#1d4266', '#666666', '#663413'),
    createTitle(months[month], years),
    createPath(hist),
    createSvgEnd()
  ].join('');

  const startYear = 1880;
  const numYearPerStep = 10;

  const items = data.flatMap((kdes, month) =>
    kdes.map((kde, decade) => {
      const years = `${startYear + numYearPerStep * decade}-${startYear +
        numYearPerStep * (decade + 1) -
        1}`;
      return {
        kde,
        src: createLinePlot(kde, years, month),
        years,
        month,
        decade
      };
    })
  );

  const piling = createPilingJs(element, {
    cellAspectRatio: aspectRatio,
    pileCellAlignment: 'center',
    cellPadding: 4,
    renderer: svgRenderer,
    items,
    columns: 12,
    pileItemOffset: [-1, 5],
    pileItemBrightness: (_, i, pile) =>
      Math.min(0.5, 0.01 * (pile.items.length - i - 1)),
    pileBackgroundColor: 'rgba(255, 255, 255, 0.66)',
    pileScale: pile => 1 + Math.min(0.5, (pile.items.length - 1) * 0.1),
    backgroundColor: '#ffffff',
    lassoFillColor: '#000000',
    lassoStrokeColor: '#000000'
  });

  piling.arrangeBy('data', 'decade');

  return piling;
};

export default createSvgLinesPiles;
