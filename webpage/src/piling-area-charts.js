import { format } from 'd3-format';
import { scaleLog, scaleTime } from 'd3-scale';
import { line } from 'd3-shape';

import createPilingJs, { createSvgRenderer } from './piling';
import { fetchJson } from './utils';

const rowPadding = 0;
const colPadding = 1;

const gridLayout = {
  AK: { i: 0, j: 0, name: 'Alaska' },
  ME: { i: 0, j: 11, name: 'Maine' },
  VT: { i: 1, j: 9, name: 'Vermont' },
  NH: { i: 1, j: 10, name: 'New Hampshire' },
  MA: { i: 1, j: 11, name: 'Massachusetts' },
  WA: { i: 2, j: 1, name: 'Washington' },
  MT: { i: 2, j: 2, name: 'Montana' },
  ND: { i: 2, j: 3, name: 'North Dakota' },
  SD: { i: 2, j: 4, name: 'South Dakota' },
  MN: { i: 2, j: 5, name: 'Minnesota' },
  WI: { i: 2, j: 6, name: 'Wisconsin' },
  MI: { i: 2, j: 7, name: 'Michigan' },
  NY: { i: 2, j: 9, name: 'New York' },
  CT: { i: 2, j: 10, name: 'Connecticut' },
  RI: { i: 2, j: 11, name: 'Rhode Island' },
  OR: { i: 3, j: 1, name: 'Oregon' },
  ID: { i: 3, j: 2, name: 'Idaho' },
  WY: { i: 3, j: 3, name: 'Wyoming' },
  NE: { i: 3, j: 4, name: 'Nebraska' },
  IA: { i: 3, j: 5, name: 'Iowa' },
  IL: { i: 3, j: 6, name: 'Illinois' },
  IN: { i: 3, j: 7, name: 'Indiana' },
  OH: { i: 3, j: 8, name: 'Ohio' },
  PA: { i: 3, j: 9, name: 'Pennsylvania' },
  NJ: { i: 3, j: 10, name: 'New Jersey' },
  CA: { i: 4, j: 0, name: 'California' },
  NV: { i: 4, j: 1, name: 'Nevada' },
  UT: { i: 4, j: 2, name: 'Utah' },
  CO: { i: 4, j: 3, name: 'Colorado' },
  KS: { i: 4, j: 4, name: 'Kansas' },
  MO: { i: 4, j: 5, name: 'Missouri' },
  KY: { i: 4, j: 6, name: 'Kentucky' },
  WV: { i: 4, j: 7, name: 'West Virginia' },
  DC: { i: 4, j: 8, name: 'District of Columbia' },
  MD: { i: 4, j: 9, name: 'Maryland' },
  DE: { i: 4, j: 10, name: 'Delaware' },
  AZ: { i: 5, j: 2, name: 'Arizona' },
  NM: { i: 5, j: 3, name: 'New Mexico' },
  OK: { i: 5, j: 4, name: 'Oklahoma' },
  AR: { i: 5, j: 5, name: 'Arkansas' },
  TN: { i: 5, j: 6, name: 'Tennessee' },
  VA: { i: 5, j: 7, name: 'Virginia' },
  NC: { i: 5, j: 8, name: 'North Carolina' },
  TX: { i: 6, j: 3, name: 'Texas' },
  LA: { i: 6, j: 4, name: 'Louisiana' },
  MS: { i: 6, j: 5, name: 'Mississippi' },
  AL: { i: 6, j: 6, name: 'Alabama' },
  GA: { i: 6, j: 7, name: 'Georgia' },
  SC: { i: 6, j: 8, name: 'South Carolina' },
  HI: { i: 7, j: 0, name: 'Hawaii' },
  FL: { i: 7, j: 7, name: 'Florida' },
};

const columns = 14;
const relHeight = 1.0;
const absWidth = 100;
const absHeight = absWidth * relHeight;
const xAxisHeight = 12;
const finalHeight = absHeight + xAxisHeight;
const aspectRatio = 1 / relHeight;
const relPreviewWidth = 0.05;

const monthNames = [
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

const addDays = (date, days) => {
  const copy = new Date(Number(date));
  copy.setDate(date.getDate() + days);
  return copy;
};

const create = async (element) => {
  const data = await fetchJson(
    'https://storage.googleapis.com/pilingjs/covid-19/us-jan-sep.json'
  );

  const numDays = data.MA.cases.length;
  const startDate = new Date('2020-01-22 00:00');
  const endDate = addDays(startDate, data.MA.cases.length);

  const { width } = element.getBoundingClientRect();

  const itemWidth = (width / columns) * 3;
  const itemHeight = itemWidth * (finalHeight / absWidth);
  const renderedItemWidth = itemWidth * 2;
  const renderedItemHeight = itemHeight * 2;
  const renderedPreviewHeight = itemWidth * (absHeight / absWidth) * 2;
  const renderedPreviewWidth = renderedPreviewHeight * relPreviewWidth;

  const svgRenderer = createSvgRenderer({
    width: renderedItemWidth,
    height: renderedItemHeight,
  });

  const svgCoverRenderer = createSvgRenderer({
    width: renderedItemWidth,
    height: renderedItemHeight,
    background: 'rgba(0, 0, 0, 0.33)',
  });

  const svgPreviewRenderer = createSvgRenderer({
    width: renderedPreviewWidth,
    height: renderedPreviewHeight,
  });

  const stepSize = absWidth / numDays;
  const halfStepSize = stepSize / 2;

  const maxCases =
    Object.values(data).reduce(
      (max, region) => Math.max(max, region.cases[numDays - 1]),
      0
    ) * 2;

  const xRange = [
    new Date('2020-02-01 00:00'),
    // new Date('2020-03-01 00:00'),
    new Date('2020-04-01 00:00'),
    // new Date('2020-05-01 00:00'),
    new Date('2020-06-01 00:00'),
    // new Date('2020-07-01 00:00'),
    new Date('2020-08-01 00:00'),
    // new Date('2020-09-01 00:00'),
  ];

  const numTicks = Math.ceil(Math.log10(maxCases));

  const yRange = Array(numTicks)
    .fill()
    .map((x, i) => 10 ** (i + 1));

  const xScale = scaleTime().domain([startDate, endDate]).nice();

  const yScale = scaleLog().domain([1, maxCases]).range([0, 1]);

  const createSvgStart = (w, h) =>
    `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;

  const createStop = (color, i, colors) => {
    const offset = ((i + 1) / (colors.length + 1)) * 100;
    return `<stop offset="${offset}%" stop-color="${color}"/>`;
  };

  const createGradient = (
    name,
    startColor,
    endColor,
    middleColors = []
  ) => `<defs>
  <linearGradient id="${name}" x1="0%" y1="100%" x2="0%" y2="0%">
    <stop offset="0%"   stop-color="${startColor}"/>
    ${middleColors.map(createStop)}
    <stop offset="100%" stop-color="${endColor}"/>
  </linearGradient>
</defs>`;

  const createSvgEnd = () => '</svg>';

  const createLine = line()
    .x((d) => halfStepSize + stepSize * d[0])
    .y((d) => absHeight - absHeight * yScale(d[1] + 1));

  const createArea = (y) => {
    const path = createLine(y);
    return [
      `<defs><mask id="path"><path d="M0,100${path}L100,100" stroke="none" fill="white"/></mask></defs>`,
      '<rect x="0" y="0" width="100" height="100" fill="url(#linear-stroke)" mask="url(#path)" />',
    ];
  };

  const createBar = (y) => {
    const yScaled = absHeight - absHeight * yScale(y + 1);
    const h = absHeight - yScaled;
    return [
      `<defs><mask id="path"><rect x="0" y="${yScaled}" width="10" height="${h}" fill="white"/></mask></defs>`,
      '<rect x="0" y="0" width="10" height="100" fill="url(#linear-stroke)" mask="url(#path)" />',
    ];
  };

  const createStackedArea = (ys) => {
    const n = ys.length;
    const commonX = {};
    ys.forEach((y) =>
      y.forEach((d) => {
        commonX[d[0]] = commonX[d[0]] ? commonX[d[0]] + 1 : 1;
      })
    );

    const cumYs = {};

    const paths = ys.map((y) => {
      const cumXy = y.reduce((_cumXy, [x, _y]) => {
        if (commonX[x] !== n) return _cumXy;
        if (!cumYs[x]) cumYs[x] = _y;
        else cumYs[x] += _y;
        _cumXy.push([x, cumYs[x]]);
        return _cumXy;
      }, []);
      return createLine(cumXy).slice(1);
    });

    return [
      '<defs>',
      paths.map(
        (path, i) =>
          `<mask id="path${i}"><path d="M0,100L${path}L100,100" stroke="none" fill="white"/></mask>`
      ),
      '</defs>',
      ys
        .map(
          (y, i) =>
            `<rect x="0" y="0" width="100" height="100" fill="url(#linear-stroke)" mask="url(#path${i})" />`
        )
        .reverse(),
      paths
        .map(
          (path) =>
            `<path d="M0,100L${path}L100,100" stroke="black" stroke-width="0.75" stroke-opacity="0.33" fill="none"/>`
        )
        .reverse(),
    ];
  };

  const createYAxis = (ticks) =>
    ticks.flatMap((tick) => {
      const label = format('~s')(tick);
      const y = 100 - yScale(tick) * 100;
      const y2 = y + 10;
      const color = '#fff';
      return [
        `<text x="0" y="${y2}" fill="${color}" fill-opacity="0.33" style="font: 10px sans-serif;">${label}</text>`,
        `<path d="M 0 ${y} L 100 ${y}" stroke="${color}" stroke-opacity="0.33" stroke-width="0.5" stroke-dasharray="1 2" fill="none"/>`,
      ];
    });

  const createXAxis = (ticks) => [
    `<line x1="0" y1="100" x2="100" y2="100" stroke="#000" stroke-opacity="0.33" stroke-width="1" />`,
    ...ticks.flatMap((tick) => {
      const label = monthNames[tick.getMonth()];
      const x = xScale(tick) * 100;
      const color = '#fff';
      return [
        `<text x="${x}" y="112" fill="${color}" fill-opacity="0.33" style="font: 10px sans-serif;" text-anchor="middle">${label}</text>`,
        `<path d="M ${x} 100 L ${x} 103" stroke="${color}" stroke-opacity="0.33" stroke-width="1" fill="none"/>`,
      ];
    }),
  ];

  const strokeColorRange = ['#444444', '#ff9957', ['#a34e23', '#d37136']];

  const toXy = (ys, binSize = 1) =>
    ys.reduce((xys, y, i) => {
      const prevY = xys[xys.length - 1] ? xys[xys.length - 1][2] : 0;

      if (i % binSize === 0) {
        xys.push([i, Math.max(0, y - prevY), y]);
      } else {
        xys[xys.length - 1][1] += Math.max(0, y - prevY);
        xys[xys.length - 1][2] = y;
      }
      return xys;
    }, []);

  const createAreaChart = (y) =>
    [
      createSvgStart(absWidth, finalHeight),
      createGradient('linear-stroke', ...strokeColorRange),
      createYAxis(yRange),
      createXAxis(xRange),
      createArea(toXy(y, 7)),
      createSvgEnd(),
    ].join('');

  const itemRenderer = (sources) => svgRenderer(sources.map(createAreaChart));

  const createBarChart = (y) =>
    [
      createSvgStart(absHeight * relPreviewWidth, absHeight),
      createGradient('linear-stroke', ...strokeColorRange),
      createBar(y),
      createSvgEnd(),
    ].join('');

  const previewRenderer = (sources) =>
    svgPreviewRenderer(sources.map(createBarChart));

  const createStackedAreaChart = (ys) =>
    [
      createSvgStart(absWidth, finalHeight),
      createGradient('linear-stroke', ...strokeColorRange),
      createYAxis(yRange),
      createXAxis(xRange),
      createStackedArea(ys.map((y) => toXy(y, 7))),
      createSvgEnd(),
    ].join('');

  const coverRenderer = (sources) =>
    svgCoverRenderer(sources.map(createStackedAreaChart));

  const itemize = ([state, { cases, longLat }]) => ({
    src: cases,
    id: state,
    region: state,
    lonLat: longLat,
    gridPosition: [
      gridLayout[state].i + rowPadding,
      gridLayout[state].j + colPadding,
    ],
  });

  const items = Object.entries(data).map(itemize);

  const previewAggregator = (_items) =>
    Promise.resolve(_items.map((item) => item.src[item.src.length - 1]));

  const coverAggregator = (_items) => {
    const sortedItems = [..._items];
    sortedItems.sort(
      (a, b) => a.src[a.src.length - 1] - b.src[b.src.length - 1]
    );
    return Promise.resolve(sortedItems.map((i) => i.src));
  };

  const previewItemOffset = (item, i) => [
    renderedItemWidth +
      (i + 0.5) * renderedPreviewHeight * relPreviewWidth * 1.25,
    renderedItemHeight / 2 -
      (renderedItemHeight / 2 - renderedPreviewHeight / 2),
  ];

  const pileOrderItems = (pile) =>
    [...pile.items].sort((a, b) => {
      const casesA = data[a].cases[data[a].cases.length - 1];
      const casesB = data[b].cases[data[b].cases.length - 1];
      return casesB - casesA;
    });

  const piling = createPilingJs(element, {
    items,
    itemRenderer,
    cellAspectRatio: aspectRatio,
    cellPadding: 6,
    columns,
    coverAggregator,
    coverRenderer,
    darkMode: true,
    navigationMode: 'panZoom',
    pileBackgroundColor: 'rgba(0, 0, 0, 0.9)',
    pileBackgroundColorHover: 'rgba(0, 0, 0, 1)',
    pileBorderColor: 'rgba(255, 255, 255, 0.1)',
    pileBorderColorHover: 'rgba(34, 34, 34, 1.0)',
    pileBorderSize: (pile) => pile.items.length,
    pileCellAlignment: 'center',
    pileItemBrightness: (_, i, pile) =>
      Math.min(0.5, 0.01 * (pile.items.length - i - 1)),
    pileItemOffset: [0, 0],
    pileLabel: 'region',
    pileLabelAlign: 'bottom',
    pileLabelColor: 'rgba(0, 0, 0, 0.0)',
    pileLabelStackAlign: 'vertical',
    pileLabelText: (pile) => pile.items.length === 1,
    pileLabelTextColor: 'rgba(255, 255, 255, 1)',
    pileOrderItems,
    pileScale: (pile) => 1 + Math.log10(pile.items.length),
    previewAggregator,
    previewItemOffset,
    previewOffset: 1,
    previewPadding: 2,
    previewRenderer,
    zoomBounds: [0, 8],
    zoomScale: (scale) =>
      scale >= 1 ? 1 + (scale - 1) / 2 : 1 - (1 - scale) / 2,
  });

  piling.subscribe(
    'itemUpdate',
    () => piling.arrangeBy('ij', 'gridPosition'),
    1
  );

  return piling;
};

export default create;
