// import { debounce } from '@flekschas/utils';
import * as d3 from 'd3';
import * as RBush from 'rbush';

import createPilingJs from '../src/library';
import { createSvgRenderer } from '../src/renderer';
import { createBoundedMercator } from '../src/projectors';

const loadMapbox = () =>
  Promise.all([
    new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = resolve;
      script.onerror = reject;
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v1.9.0/mapbox-gl.js';
      document.head.appendChild(script);
    }),
    new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.onload = resolve;
      link.onerror = reject;
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v1.9.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    })
  ]);

const createMapbox = (element, darkMode) => () => {
  const mapEl = document.createElement('div');
  mapEl.id = 'map';
  element.appendChild(mapEl);
  mapEl.style.position = 'absolute';
  mapEl.style.zIndex = 0;
  mapEl.style.width = '100%';
  mapEl.style.height = '100%';
  mapEl.style.opacity = 0;
  mapEl.style.transition = 'opacity 0.25s ease';

  window.mapboxgl.workerCount = 1;
  window.mapboxgl.accessToken =
    'pk.eyJ1IjoiZmxla3NjaGFzIiwiYSI6ImNqZXB2aWd4NDBmZTIzM3BjdGZudTFob2oifQ.Jnmp1xWJyS4_lRhzrZAFBQ';

  const map = new window.mapboxgl.Map({
    container: mapEl,
    style: darkMode
      ? 'mapbox://styles/flekschas/cjx3bh1701w8i1dn33wx6iugc'
      : 'mapbox://styles/flekschas/ck8qb1rew01wi1ijyh00coodb',
    zoom: 0,
    center: [0, 0],
    minZoom: 0,
    maxZoom: 22,
    interactive: false
  });

  return map;
};

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
  'Dec'
];

const addDays = (date, days) => {
  const copy = new Date(Number(date));
  copy.setDate(date.getDate() + days);
  return copy;
};

const create = async (element, darkMode) => {
  const pilingEl = document.createElement('div');
  pilingEl.style.position = 'absolute';
  pilingEl.style.zIndex = 1;
  pilingEl.style.width = '100%';
  pilingEl.style.height = '100%';

  element.appendChild(pilingEl);

  let data = await fetch('data/covid-19.json');
  data = await data.json();

  const numDays = data.US.cases.length;
  const startDate = new Date('2020-01-22 00:00');
  const endDate = addDays(startDate, data.US.cases.length);

  const map = await loadMapbox().then(createMapbox(element, darkMode));
  map.setCenter([0, 0]);
  map.setZoom(0);
  const minZoom = map.getZoom();

  const level1Index = new RBush();
  const level2Index = new RBush();

  Object.entries(data).forEach(([id, region]) => {
    if (region.level === 0) return;

    const index = region.level === 1 ? level1Index : level2Index;

    index.insert({
      id,
      minX: region.longLat[0] - 0.1,
      maxX: region.longLat[0] + 0.1,
      minY: -1 * region.longLat[1] - 0.1,
      maxY: -1 * region.longLat[1] + 0.1
    });
  });

  const { width, height } = element.getBoundingClientRect();

  const columns = 20;
  const relHeight = 1.0;
  const absWidth = 100;
  const absHeight = absWidth * relHeight;
  const xAxisHeight = 12;
  const finalHeight = absHeight + xAxisHeight;
  const aspectRatio = 1 / relHeight;
  const itemWidth = (width / columns) * 3;
  const itemHeight = itemWidth * (finalHeight / absWidth);

  const renderedItemWidth = itemWidth * 2;
  const renderedItemHeight = itemHeight * 2;

  const relPreviewWidth = 0.05;
  const renderedPreviewHeight = itemWidth * (absHeight / absWidth) * 2;
  const renderedPreviewWidth = renderedPreviewHeight * relPreviewWidth;

  const svgRenderer = createSvgRenderer({
    width: renderedItemWidth,
    height: renderedItemHeight
  });

  const svgCoverRenderer = createSvgRenderer({
    width: renderedItemWidth,
    height: renderedItemHeight,
    background: 'rgba(0, 0, 0, 0.33)'
  });

  const svgPreviewRenderer = createSvgRenderer({
    width: renderedPreviewWidth,
    height: renderedPreviewHeight
  });

  const stepSize = absWidth / numDays;
  const halfStepSize = stepSize / 2;

  const maxCases = Object.values(data).reduce(
    (max, region) => Math.max(max, region.cases[numDays - 1]),
    0
  );

  const xRange = [
    new Date('2020-02-01 00:00'),
    new Date('2020-03-01 00:00'),
    new Date('2020-04-01 00:00')
  ];

  const numTicks = Math.ceil(Math.log10(maxCases));

  const yRange = Array(numTicks)
    .fill()
    .map((x, i) => 10 ** (i + 1));

  const xScale = d3
    .scaleTime()
    .domain([startDate, endDate])
    .nice();

  const yScale = d3
    .scaleLog()
    .domain([1, maxCases])
    .range([0, 1]);

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

  const createLine = d3
    .line()
    .x(d => halfStepSize + stepSize * d[0])
    .y(d => absHeight - absHeight * yScale(d[1] + 1));

  const createArea = y => {
    const path = createLine(y).slice(1);
    return [
      `<defs><mask id="path"><path d="M0,100L${path}L100,100" stroke="none" fill="white"/></mask></defs>`,
      '<rect x="0" y="0" width="100" height="100" fill="url(#linear-stroke)" mask="url(#path)" />'
    ];
  };

  const createBar = y => {
    const yScaled = absHeight - absHeight * yScale(y + 1);
    const h = absHeight - yScaled;
    return [
      `<defs><mask id="path"><rect x="0" y="${yScaled}" width="10" height="${h}" fill="white"/></mask></defs>`,
      '<rect x="0" y="0" width="10" height="100" fill="url(#linear-stroke)" mask="url(#path)" />'
    ];
  };

  const createStackedArea = ys => {
    const n = ys.length;
    const commonX = {};
    ys.forEach(y =>
      y.forEach(d => {
        commonX[d[0]] = commonX[d[0]] ? commonX[d[0]] + 1 : 1;
      })
    );

    const cumYs = {};

    const paths = ys.map(y => {
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
          path =>
            `<path d="M0,100L${path}L100,100" stroke="black" stroke-width="0.75" stroke-opacity="0.33" fill="none"/>`
        )
        .reverse()
    ];
  };

  const createYAxis = ticks =>
    ticks.flatMap(tick => {
      const label = d3.format('~s')(tick);
      const y = 100 - yScale(tick) * 100;
      const y2 = y + 10;
      const color = darkMode ? '#fff' : '#000';
      return [
        `<text x="0" y="${y2}" fill="${color}" fill-opacity="0.33" style="font: 10px sans-serif;">${label}</text>`,
        `<path d="M 0 ${y} L 100 ${y}" stroke="${color}" stroke-opacity="0.33" stroke-width="0.5" stroke-dasharray="1 2" fill="none"/>`
      ];
    });

  const createXAxis = ticks => [
    `<line x1="0" y1="100" x2="100" y2="100" stroke="#000" stroke-opacity="0.33" stroke-width="1" />`,
    ...ticks.flatMap(tick => {
      const label = monthNames[tick.getMonth()];
      const x = xScale(tick) * 100;
      const color = darkMode ? '#fff' : '#000';
      return [
        `<text x="${x}" y="112" fill="${color}" fill-opacity="0.33" style="font: 10px sans-serif;" text-anchor="middle">${label}</text>`,
        `<path d="M ${x} 100 L ${x} 103" stroke="${color}" stroke-opacity="0.33" stroke-width="1" fill="none"/>`
      ];
    })
  ];

  const strokeColorRange = darkMode
    ? ['#444444', '#ff9957', ['#a34e23', '#d37136']]
    : ['#bbbbbb', '#802000', ['#c76526']];

  const toXy = ys =>
    ys.reduce((xys, y, i) => {
      if (y !== null) xys.push([i, y]);
      return xys;
    }, []);

  const createAreaChart = y =>
    [
      createSvgStart(absWidth, finalHeight),
      createGradient('linear-stroke', ...strokeColorRange),
      // createYAxis(yRange),
      // createXAxis(xRange),
      createArea(toXy(y)),
      createSvgEnd()
    ].join('');

  const renderer = sources => svgRenderer(sources.map(createAreaChart));

  const createBarChart = y =>
    [
      createSvgStart(absHeight * relPreviewWidth, absHeight),
      createGradient('linear-stroke', ...strokeColorRange),
      createBar(y),
      createSvgEnd()
    ].join('');

  const previewRenderer = sources =>
    svgPreviewRenderer(sources.map(createBarChart));

  const createStackedAreaChart = ys =>
    [
      createSvgStart(absWidth, finalHeight),
      createGradient('linear-stroke', ...strokeColorRange),
      createYAxis(yRange),
      createXAxis(xRange),
      createStackedArea(ys.map(toXy)),
      createSvgEnd()
    ].join('');

  const coverRenderer = sources =>
    svgCoverRenderer(sources.map(createStackedAreaChart));

  const itemize = ([region, { cases, longLat, level, numLevels }]) => {
    let r = region
      .replace(', United Kingdom', ', UK')
      .replace(', Netherlands', ', NL')
      .replace(', Denmark', ', DK')
      .replace(', Canada', ', CA')
      .replace(', France', ', FR')
      .replace(', Australia', ', AU')
      .replace(' and ', ' & ')
      .replace(' Islands', ' Is.')
      .replace(' Island', ' Is.');

    const lastCommaIdx = r.lastIndexOf(',');

    if (lastCommaIdx >= 0) {
      let f = r.slice(0, lastCommaIdx);
      f = f.length >= 12 ? `${f.slice(0, 11)}…` : f;
      r = `${f}${r.slice(lastCommaIdx)}`;
    } else {
      r = r.length >= 16 ? `${r.slice(0, 15)}…` : r;
    }

    return {
      src: cases,
      id: region,
      region: r,
      lonLat: longLat,
      level,
      numLevels
    };
  };

  const countriesAndStates = Object.entries(data)
    .filter(([, d]) => d.level <= 1)
    .map(itemize);

  const previewAggregator = _items =>
    Promise.resolve(_items.map(item => item.src[item.src.length - 1]));

  const coverAggregator = _items => {
    const sortedItems = [..._items];
    sortedItems.sort(
      (a, b) => a.src[a.src.length - 1] - b.src[b.src.length - 1]
    );
    return Promise.resolve(sortedItems.map(i => i.src));
  };

  const boundedMercator = createBoundedMercator(width, height);

  const getItems = level => {
    const { lng: minLng, lat: minLat } = map.unproject([0, 0]);
    const { lng: maxLng, lat: maxLat } = map.unproject([width, height]);

    const bBox = {
      minX: minLng,
      maxX: maxLng,
      minY: -1 * minLat,
      maxY: -1 * maxLat
    };

    const items = countriesAndStates.filter(
      country =>
        !country.numLevels ||
        country.numLevels < level ||
        country.level === level
    );

    if (level === 2) {
      const hits = level2Index.search(bBox);
      items.push(...hits.map(hit => [hit.id, data[hit.id]]).map(itemize));
    }

    return items;
  };

  const previewItemOffset = (item, i) => [
    renderedItemWidth +
      (i + 0.5) * renderedPreviewHeight * relPreviewWidth * 1.25,
    renderedItemHeight / 2 -
      (renderedItemHeight / 2 - renderedPreviewHeight / 2)
  ];

  const pileOrderItems = pile =>
    [...pile.items].sort((a, b) => {
      const casesA = data[a].cases[data[a].cases.length - 1];
      const casesB = data[b].cases[data[b].cases.length - 1];
      return casesB - casesA;
    });

  const piling = createPilingJs(pilingEl, {
    darkMode,
    cellAspectRatio: aspectRatio,
    pileCellAlignment: 'center',
    cellPadding: 4,
    renderer,
    coverAggregator,
    coverRenderer,
    previewAggregator,
    previewRenderer,
    items: getItems(1),
    itemSize: 36,
    pileBackgroundColor: darkMode
      ? 'rgba(0, 0, 0, 0)'
      : 'rgba(255, 255, 255, 0)',
    pileBackgroundColorHover: darkMode
      ? 'rgba(0, 0, 0, 1)'
      : 'rgba(255, 255, 255, 1)',
    // pileBorderSize: 1,
    // pileBorderColor: 'rgba(255,255,255,0.1)',
    pileBorderColorHover: darkMode
      ? 'rgba(34, 34, 34, 1.0)'
      : 'rgba(224, 224, 224, 1.0)',
    pileItemOffset: [0, 0],
    pileItemBrightness: (_, i, pile) =>
      Math.min(0.5, 0.01 * (pile.items.length - i - 1)),
    // pileLabel: 'region',
    pileLabelAlign: 'top',
    pileLabelStackAlign: 'vertical',
    pileLabelText: pile => pile.items.length === 1,
    pileLabelColor: 'rgba(0, 0, 0, 0.0)',
    pileLabelTextColor: darkMode
      ? 'rgba(255, 255, 255, 1)'
      : 'rgba(0, 0, 0, 1)',
    pileOrderItems,
    pileVisibilityItems: pile => pile.items.length < 2,
    previewOffset: 1,
    previewPadding: 2,
    previewItemOffset,
    projector: ll => boundedMercator.toPx(ll),
    zoomBounds: [0, 8],
    // zoomScale: scale =>
    //   scale >= 1 ? 1 + (scale - 1) / 3 : 1 - (1 - scale) / 3,
    showSpatialIndex: false
  });

  const whenItemUpdated = () =>
    new Promise(resolve => piling.subscribe('itemUpdate', resolve, 1));
  const whenItemLastUpdated = whenItemUpdated();

  const scaleToZoom = scale => Math.log(scale) / Math.LN2;

  // const zoomInThresholds = zoomLevel => {
  //   if (zoomLevel >= 6) return 2;
  //   return 1;
  // };

  // const zoomOutThresholds = zoomLevel => {
  //   if (zoomLevel <= 4.5) return 1;
  //   return 2;
  // };

  // const setItems = level => {
  //   const items = getItems(level);
  //   piling.set('items', items);
  //   whenItemUpdated().then(piling.arrangeBy('custom', 'lonLat'));
  //   lastLevel = level;
  // };

  // const setItemsDb = debounce(setItems, 500);

  // let lastLevel = 1;
  // const updateItems = (zoomLevel, lastZoomLevel) => {
  //   const level =
  //     zoomLevel > lastZoomLevel
  //       ? zoomInThresholds(zoomLevel)
  //       : zoomOutThresholds(zoomLevel);

  //   if (level !== lastLevel || level > 0) {
  //     setItemsDb(level);
  //   }
  // };

  // let lastZoomLevel = 0;

  let whenArranged = whenItemLastUpdated;
  const additionalSidebarOptions = [
    {
      title: 'Explore Geospatially',
      fields: [
        {
          name: 'Arrange on worldmap',
          action: () => {
            whenArranged = whenItemLastUpdated.then(() => {
              map.getContainer().style.opacity = 1;
              piling.set('navigationMode', 'panZoom');
              piling.subscribe('zoom', camera => {
                const zoomLevel = scaleToZoom(camera.scaling);
                map.panTo(boundedMercator.toLl(camera.target), {
                  animate: false
                });
                map.setZoom(minZoom + zoomLevel);
                // updateItems(zoomLevel, lastZoomLevel);
                // lastZoomLevel = zoomLevel;
              });
              return piling.arrangeBy('custom', 'lonLat');
            });
          }
        },
        {
          name: 'Automatically group and split',
          action: () => {
            whenArranged
              .then(() => piling.splitAll())
              .then(() => {
                piling.splitBy('distance', 0.5, { onZoom: true });
                piling.groupBy('overlap', 384, { onZoom: true });
              });
          }
        },
        {
          name: 'Show previews',
          labelMinWidth: '6rem',
          nullifiable: true,
          dtype: 'boolean',
          setter: isChecked => {
            piling.set(
              'pileVisibilityItems',
              isChecked || (pile => pile.items.length < 2)
            );
          }
        }
      ]
    }
  ];

  return [piling, additionalSidebarOptions];
};

export default create;
