import { line } from 'd3-shape';

import createPilingJs, { createSvgRenderer } from './piling';
import { fetchJson } from './utils';

export default async function create(element) {
  const data = await fetchJson(
    'https://storage.googleapis.com/pilingjs/global-surface-temperature/data.json'
  );

  const { width } = element.getBoundingClientRect();

  const fromX = -1.5;
  const toX = 1.5;
  const numSteps = 50;
  const domainSize = toX - fromX;
  const stepSize = domainSize / numSteps;
  const columns = 12;
  const relHeight = 0.4;
  const absHeight = 100 * relHeight;
  const tickHeight = 3;
  const aspectRatio = 1 / relHeight;
  const itemWidth = (width / columns) * 3;
  const itemHeight = itemWidth * relHeight;

  const svgRenderer = createSvgRenderer({
    width: itemWidth,
    height: itemHeight,
    color: '#333',
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
    'Dec',
  ];

  const createSvgStart = () =>
    `<svg viewBox="0 0 100 ${
      absHeight + tickHeight
    }" xmlns="http://www.w3.org/2000/svg">`;

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
    .y((d) => absHeight - absHeight * d);

  const createPath = (kde) => {
    const path = createLine(kde);
    return `<path d="M${absHeight},0${path}L100,${absHeight}L" stroke="url(#linear-stroke)" stroke-size="1" fill="url(#linear-fill)"/>`;
  };

  const createTitle = (titleLeft, titleRight, avgTemp) =>
    `<foreignObject x="1" y="${absHeight - 9}" width="100" height="12">
  <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; justify-content: space-between; font: 8px sans-serif; color: #999">
    <span>${titleLeft} ${avgTemp > 0 ? titleRight : ''}</span>
    <span>${avgTemp <= 0 ? titleRight : ''}</span>
  </div>
</foreignObject>`;

  const createAxis = (ticks) => {
    const tickEls = ticks.map((tick) => {
      const x = ((tick - fromX) / domainSize) * 100;
      return `<line x1="${x}" y1="0" x2="${x}" y2="${tickHeight}" stroke="black" opacity="0.33" />`;
    });
    return `<g transform="translate(0 ${absHeight})">${tickEls.join('')}</g>`;
  };

  const getAvgTemp = (hist) =>
    fromX + (hist.findIndex((x) => x === 1) + 0.5) * stepSize;

  const fillColorRange = ['#245280', '#333333', '#804118'];
  const strokeColorRange = ['#3d8cd9', '#808080', '#d96921'];

  // prettier-ignore
  const createLinePlot = (hist, years, month) => [
    createSvgStart(),
    createGradient('linear-fill', ...fillColorRange),
    createGradient('linear-stroke', ...strokeColorRange),
    createTitle(months[month], years, getAvgTemp(hist)),
    createPath(hist),
    createAxis([-1, 0, 1]),
    createSvgEnd()
  ].join('');

  const startYear = 1880;
  const numYearPerStep = 10;

  const items = data.flatMap((kdes, numMonth) =>
    numMonth % 3 === 0
      ? kdes.map((kde, numDecade) => {
          const years = `${startYear + numYearPerStep * numDecade}s`;
          return {
            kde,
            src: createLinePlot(kde, years, numMonth),
            decade: years,
            month: months[numMonth],
            numMonth,
            numDecade,
          };
        })
      : []
  );

  const piling = createPilingJs(element, {
    darkMode: true,
    cellAspectRatio: aspectRatio,
    pileCellAlignment: 'center',
    cellPadding: 4,
    renderer: svgRenderer,
    items,
    columns: 4,
    pileItemOffset: [0, 8],
    pileItemBrightness: (_, i, pile) =>
      Math.max(-0.5, -0.075 * (pile.items.length - i - 1) + 0.05),
    // pileScale: (pile) => 1 + Math.min(0.5, (pile.items.length - 1) * 0.075),
    pileOrderItems: (pile) => [...pile.items].sort((a, b) => a - b),
  });

  piling.subscribe('itemUpdate', async () => {
    await piling.arrangeBy('data', 'numDecade');
    piling.groupBy('column', 'top');
  });

  return piling;
}
