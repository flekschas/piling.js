import { isFunction } from '@flekschas/utils';
import createPhotoPiles from './photos';
import createMatrixPiles from './matrices';
import createCovidPiles from './covid-19';
import createScatterplotPiles from './scatterplots';
import createDrawingPiles from './drawings';
import createVitessce from './vitessce';
import createRidgePlotPiles from './ridge-plot';
import createTimeSeriesPiles from './time-series';
import createBookPiles from './books';

import { createRequestIdleCallback } from './utils';

import './index.scss';

const photosEl = document.getElementById('photos');
const matricesEl = document.getElementById('matrices');
const covidEl = document.getElementById('covid');
const scatterplotsEl = document.getElementById('scatterplots');
const drawingsEl = document.getElementById('drawings');
const vitessceEl = document.getElementById('vitessce');
const ridgePlotEl = document.getElementById('ridgeplot');
const timeseriesEl = document.getElementById('timeseries');
const booksEl = document.getElementById('books');

const photosCreditEl = document.getElementById('photos-credit');
const matricesCreditEl = document.getElementById('matrices-credit');
const covidCreditEl = document.getElementById('covid-credit');
const scatterplotsCreditEl = document.getElementById('scatterplots-credit');
const drawingsCreditEl = document.getElementById('drawings-credit');
const vitessceCreditEl = document.getElementById('vitessce-credit');
const ridgePlotCreditEl = document.getElementById('ridgeplot-credit');
const timeseriesCreditEl = document.getElementById('timeseries-credit');
const booksCreditEl = document.getElementById('books-credit');

const conditionalElements = [
  photosEl,
  matricesEl,
  covidEl,
  scatterplotsEl,
  drawingsEl,
  vitessceEl,
  ridgePlotEl,
  timeseriesEl,
  booksEl,
  photosCreditEl,
  matricesCreditEl,
  covidCreditEl,
  scatterplotsCreditEl,
  drawingsCreditEl,
  vitessceCreditEl,
  ridgePlotCreditEl,
  timeseriesCreditEl,
  booksCreditEl
];

const optionsEl = document.getElementById('options');
const optionsTogglerEl = document.getElementById('options-toggler');
const undoButton = document.getElementById('undo');

let piling;

const urlQueryParams = new URLSearchParams(window.location.search);

let history = [];

const undoHandler = () => {
  if (history.length === 0) return;
  // Remove the current history
  history.pop();
  if (history.length === 0) return;
  piling.importState(history[history.length - 1]);
  if (history.length === 0) undoButton.disabled = true;
};

undoButton.addEventListener('click', undoHandler);

const ignoredActions = new Set([
  'OVERWRITE',
  'SOFT_OVERWRITE',
  'SET_CLICKED_PILE',
  'SET_FOCUSED_PILES',
  'SET_MAGNIFIED_PILES'
]);

const updateHandler = ({ action }) => {
  if (ignoredActions.has(action.type)) return;

  undoButton.disabled = false;

  const state = piling.exportState();
  history.push(state);

  // eslint-disable-next-line no-console
  console.log('Update', action.type, history.length);

  if (history.length > 10) history.shift();
};

const requestIdleCallback = createRequestIdleCallback();

const updateHandlerIdled = (...args) =>
  requestIdleCallback(() => {
    updateHandler(...args);
  });

const hideEl = el => {
  el.style.display = 'none';
};

const pilingEls = {
  photos: photosEl,
  matrices: matricesEl,
  covid: covidEl,
  drawings: drawingsEl,
  ridgeplot: ridgePlotEl,
  vitessce: vitessceEl,
  scatterplots: scatterplotsEl,
  timeseries: timeseriesEl,
  books: booksEl
};
const createPiles = async example => {
  let element;
  let createPiling;
  let additionalOptions;

  const darkMode = window.mode === 'dark-mode';

  document.querySelector('#error').style.display = 'none';
  document.querySelector('#no-webgl2-support').style.display = 'none';
  document.querySelector('#unknown-example').style.display = 'none';
  document.querySelector('#general-error').style.display = 'block';

  if (piling) piling.destroy();
  conditionalElements.forEach(hideEl);
  undoButton.disabled = true;

  switch (example) {
    case 'photos':
      photosEl.style.display = 'block';
      photosCreditEl.style.display = 'block';
      createPiling = createPhotoPiles;
      element = photosEl;
      break;

    case 'matrices':
      matricesEl.style.display = 'block';
      matricesCreditEl.style.display = 'block';
      createPiling = createMatrixPiles;
      element = matricesEl;
      break;

    case 'covid':
      covidEl.style.display = 'block';
      covidCreditEl.style.display = 'block';
      createPiling = createCovidPiles;
      element = covidEl;
      break;

    case 'drawings':
      drawingsEl.style.display = 'block';
      drawingsCreditEl.style.display = 'block';
      createPiling = createDrawingPiles;
      element = drawingsEl;
      break;

    case 'ridgeplot':
      ridgePlotEl.style.display = 'block';
      ridgePlotCreditEl.style.display = 'block';
      createPiling = createRidgePlotPiles;
      element = ridgePlotEl;
      break;

    case 'vitessce':
      vitessceEl.style.display = 'block';
      vitessceCreditEl.style.display = 'block';
      createPiling = createVitessce;
      element = vitessceEl;
      break;

    case 'scatterplots':
      scatterplotsEl.style.display = 'block';
      scatterplotsCreditEl.style.display = 'block';
      createPiling = createScatterplotPiles;
      element = scatterplotsEl;
      break;

    case 'timeseries':
      timeseriesEl.style.display = 'block';
      timeseriesCreditEl.style.display = 'block';
      createPiling = createTimeSeriesPiles;
      element = timeseriesEl;
      break;

    case 'books':
      booksEl.style.display = 'block';
      booksCreditEl.style.display = 'block';
      createPiling = createBookPiles;
      element = booksEl;
      break;

    default:
      console.warn('Unknown example:', example);
      break;
  }

  if (createPiling) {
    const response = await createPiling(element, darkMode);
    if (response) {
      [piling, additionalOptions] = response;
      history = [];
      piling.subscribe('update', updateHandlerIdled);
    } else {
      document.querySelector('#error').style.display = 'flex';
    }
  } else {
    document.querySelector('#error').style.display = 'flex';
    document.querySelector('#unknown-example').style.display = 'block';
    document.querySelector('#general-error').style.display = 'none';
  }

  return [piling, additionalOptions];
};

const exampleEl = document.getElementById('example');

exampleEl.addEventListener('change', event => {
  urlQueryParams.set('example', event.target.value);
  window.location.search = urlQueryParams.toString();
});

let example = urlQueryParams.get('example')
  ? urlQueryParams
      .get('example')
      .split(' ')[0]
      .toLowerCase()
  : null;

switch (example) {
  case 'matrices':
    exampleEl.selectedIndex = 1;
    break;

  case 'covid':
    exampleEl.selectedIndex = 2;
    break;

  case 'drawings':
    exampleEl.selectedIndex = 3;
    break;

  case 'ridgeplot':
    exampleEl.selectedIndex = 4;
    break;

  case 'vitessce':
    exampleEl.selectedIndex = 5;
    break;

  case 'scatterplots':
    exampleEl.selectedIndex = 6;
    break;

  case 'timeseries':
    exampleEl.selectedIndex = 7;
    break;

  case 'books':
    exampleEl.selectedIndex = 7;
    break;

  case 'photos':
  default:
    example = 'photos';
    exampleEl.selectedIndex = 0;
    break;
}

let isOptionsOpen = false;
const bodyClasses = document.body.className;

const handleOptionsTogglerClick = event => {
  event.preventDefault();

  isOptionsOpen = !isOptionsOpen;

  if (isOptionsOpen) {
    optionsEl.setAttribute('class', 'open');
    document.body.setAttribute('class', `${bodyClasses} options-open`);
  } else {
    optionsEl.removeAttribute('class');
    document.body.setAttribute('class', bodyClasses);
  }
};

optionsTogglerEl.addEventListener('click', handleOptionsTogglerClick);

createPiles(example).then(([pilingLib, additionalOptions = []]) => {
  const firstItem = pilingLib.get('items')[0];

  const excludedProps = ['src', 'id'];
  const numericalProps = Object.keys(firstItem).filter(
    prop =>
      excludedProps.indexOf(prop) === -1 && !Number.isNaN(+firstItem[prop])
  );
  const categoricalProps = Object.keys(firstItem).filter(
    prop =>
      excludedProps.indexOf(prop) === -1 && typeof firstItem[prop] === 'string'
  );
  const spatialProps = Object.keys(firstItem).filter(
    prop =>
      excludedProps.indexOf(prop) === -1 &&
      Array.isArray(firstItem[prop]) &&
      firstItem[prop].length === 2
  );

  const groupByGrid = document.body.querySelector('#group-by-grid');
  const groupByGridCanvas = groupByGrid.querySelector('canvas');
  const groupByGridCtx = groupByGridCanvas.getContext('2d');
  let groupByGridColumns = null;
  let groupByGridActive = false;

  const pilingScrollEl = pilingEls[exampleEl.value].querySelector('div');

  const cleargroupByGrid = () => {
    groupByGridCtx.clearRect(0, 0, groupByGridCtx.width, groupByGridCtx.height);
  };

  const drawgroupByGrid = columns => {
    groupByGrid.style.zIndex = 1;
    const { width, height } = groupByGridCanvas.getBoundingClientRect();
    const res = window.devicePixelRatio;
    groupByGridCanvas.width = width * res;
    groupByGridCanvas.height = height * res;

    let {
      cellAspectRatio,
      columnWidth,
      numColumns,
      numRows,
      rowHeight
    } = pilingLib.get('layout');

    if (columns) {
      numColumns = columns;
      columnWidth = width / numColumns;
      cellAspectRatio = pilingLib.get('cellAspectRatio');
      rowHeight = columnWidth / cellAspectRatio;
      numRows = Math.ceil(height / rowHeight);
    }

    const offsetY = pilingScrollEl.scrollTop % rowHeight;

    cleargroupByGrid();

    groupByGridCtx.strokeStyle = '#ff7ff6';
    groupByGridCtx.beginPath();

    for (let i = 1; i < numRows; i++) {
      groupByGridCtx.moveTo(0, i * rowHeight * res - offsetY * res);
      groupByGridCtx.lineTo(width * res, i * rowHeight * res - offsetY * res);
    }

    for (let j = 1; j < numColumns; j++) {
      groupByGridCtx.moveTo(j * columnWidth * res, 0);
      groupByGridCtx.lineTo(j * columnWidth * res, height * res);
    }

    groupByGridCtx.stroke();
  };

  let arrangeByType = 'uv';
  let arrangeByProp = spatialProps[0];
  let arrangementObjective;
  let arrangeOnGrouping = false;

  let groupByRow = 'center';
  let groupByColumn = 'top';
  let groupByOverlapSqPx = 1;
  let groupByDistancePx = 1;
  let groupByCategory = categoricalProps[0];

  let pileItemOffsetX;
  let pileItemOffsetY;
  const pileItemOffsetDisable = isFunction(piling.get('pileItemOffset'));
  if (!pileItemOffsetDisable) {
    const [x, y] = piling.get('pileItemOffset');
    pileItemOffsetX = x;
    pileItemOffsetY = y;
  }

  let [pileSizeBadgeAlignY, pileSizeBadgeAlignX] = piling.get(
    'pileSizeBadgeAlign'
  );

  const pileLabelTextDisable =
    isFunction(piling.get('pileLabelText')) ||
    Array.isArray(piling.get('pileLabelText'));

  const options = [
    {
      id: 'pile-item',
      title: 'Pile/Item',
      fields: [
        {
          name: 'Item size',
          propName: 'itemSize',
          labelMinWidth: '4rem',
          dtype: 'int',
          min: 4,
          max: 320,
          numSteps: 79,
          nullifiable: true
        },
        {
          name: 'Item offset',
          propName: 'pileItemOffset',
          width: '6rem',
          dtype: null,
          hide: pileItemOffsetDisable || piling.get('previewRenderer'),
          subInputs: [
            {
              name: 'x',
              dtype: 'float',
              defaultValue: pileItemOffsetX,
              setter: x => {
                pileItemOffsetX = x;
                piling.set('pileItemOffset', [
                  pileItemOffsetX,
                  pileItemOffsetY
                ]);
              }
            },
            {
              name: 'y',
              dtype: 'float',
              defaultValue: pileItemOffsetY,
              setter: y => {
                pileItemOffsetY = y;
                piling.set('pileItemOffset', [
                  pileItemOffsetX,
                  pileItemOffsetY
                ]);
              }
            }
          ]
        },
        // Can't be adjusted dynamically at the moment
        // {
        //   name: 'previewPadding',
        //   hide: isFunction(pilingLib.get('previewPadding')),
        //   labelMinWidth: '5rem',
        //   dtype: 'int',
        //   min: 0,
        //   max: 10
        // },
        {
          name: 'Preview spacing',
          propName: 'previewSpacing',
          hide:
            isFunction(pilingLib.get('previewSpacing')) ||
            !piling.get('previewRenderer'),
          labelMinWidth: '5rem',
          dtype: 'int',
          min: 0,
          max: 10
        },
        {
          name: 'Preview offset',
          propName: 'previewOffset',
          hide:
            isFunction(pilingLib.get('previewOffset')) ||
            !piling.get('previewRenderer'),
          labelMinWidth: '5rem',
          dtype: 'int',
          min: 0,
          max: 10
        }
      ]
    },
    {
      id: 'layout',
      title: 'Layout',
      fields: [
        {
          name: 'Cell size',
          propName: 'cellSize',
          labelMinWidth: '4rem',
          dtype: 'int',
          min: 16,
          max: 320,
          numSteps: 38,
          nullifiable: true
        },
        {
          name: 'Cell padding',
          propName: 'cellPadding',
          labelMinWidth: '4rem',
          dtype: 'int',
          min: 0,
          max: 64,
          numSteps: 32
        },
        {
          name: 'Columns',
          propName: 'columns',
          labelMinWidth: '4rem',
          dtype: 'int',
          min: 2,
          max: 80,
          numSteps: 39,
          nullifiable: true
        },
        {
          name: 'Row height',
          propName: 'rowHeight',
          labelMinWidth: '4rem',
          dtype: 'int',
          min: 16,
          max: 320,
          numSteps: 38,
          nullifiable: true
        },
        {
          name: 'Cell aspect ratio',
          propName: 'cellAspectRatio',
          labelMinWidth: '6.25rem',
          dtype: 'float',
          nullifiable: true
        },
        {
          name: 'Cell alignment',
          propName: 'pileCellAlignment',
          labelMinWidth: '6.25rem',
          dtype: 'string',
          values: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center']
        }
      ]
    },
    {
      id: 'arrangement',
      title: 'Arrangement',
      fields: [
        {
          name: 'Pile properties',
          dtype: 'string',
          values: numericalProps,
          setter: values => {
            arrangementObjective = values;
            return values && values.length
              ? pilingLib.arrangeBy('data', values, {
                  onGrouping: arrangeOnGrouping
                })
              : pilingLib.arrangeBy();
          },
          multiple: true,
          nullifiable: true
        },
        {
          name: 'arrangeBy',
          hide: spatialProps.length === 0,
          width: '4rem',
          action: () => {
            pilingLib.arrangeBy(arrangeByType, arrangeByProp, {
              onGrouping: arrangeOnGrouping
            });
          },
          subInputs: [
            {
              dtype: 'string',
              values: ['uv', 'ij', 'xy', 'custom'],
              defaultValue: arrangeByType,
              setter: type => {
                arrangeByType = type;
              }
            },
            {
              dtype: 'string',
              values: spatialProps,
              defaultValue: arrangeByProp,
              setter: prop => {
                arrangeByProp = prop;
              }
            }
          ]
        },
        {
          name: 'Update arrangement on grouping',
          labelMinWidth: '5rem',
          dtype: 'boolean',
          nullifiable: true,
          setter: isChecked => {
            arrangeOnGrouping = isChecked;
            return arrangementObjective && arrangementObjective.length
              ? pilingLib.arrangeBy('data', arrangementObjective, {
                  onGrouping: arrangeOnGrouping
                })
              : pilingLib.arrangeBy();
          }
        },
        {
          name: 'Navigation mode',
          propName: 'navigationMode',
          dtype: 'string',
          values: ['auto', 'panZoom', 'scroll']
        }
      ]
    },
    {
      id: 'grouping',
      title: 'Group By',
      fields: [
        {
          name: 'Row',
          width: '4rem',
          action: () => {
            pilingLib.groupBy('row', groupByRow);
          },
          subInputs: [
            {
              dtype: 'string',
              values: ['left', 'center', 'right'],
              defaultValue: groupByRow,
              setter: direction => {
                groupByRow = direction;
              }
            }
          ]
        },
        {
          name: 'Column',
          width: '4rem',
          action: () => {
            pilingLib.groupBy('column', groupByColumn);
          },
          subInputs: [
            {
              dtype: 'string',
              values: ['top', 'center', 'bottom'],
              defaultValue: groupByColumn,
              setter: direction => {
                groupByColumn = direction;
              }
            }
          ]
        },
        {
          name: 'Grid',
          width: '4rem',
          action: () => {
            const objective =
              groupByGridColumns !== null
                ? { columns: groupByGridColumns }
                : undefined;
            pilingLib.groupBy('grid', objective);
          },
          onMouseenter: () => {
            drawgroupByGrid(groupByGridColumns);
          },
          onMousedown: () => {
            groupByGridActive = true;
            if (groupByGridColumns) drawgroupByGrid(groupByGridColumns);
          },
          onMouseleave: function onMouseup() {
            if (!groupByGridActive) {
              cleargroupByGrid();
              groupByGrid.style.zIndex = -1;
            }
          },
          onMouseup: function onMouseup() {
            groupByGridActive = false;
            cleargroupByGrid();
            groupByGrid.style.zIndex = -1;
          },
          subInputs: [
            {
              dtype: 'int',
              min: 1,
              max: 20,
              onInput: true,
              setter: columns => {
                groupByGridColumns = columns;
                if (groupByGridActive && columns !== null) {
                  drawgroupByGrid(columns);
                } else {
                  cleargroupByGrid();
                  groupByGrid.style.zIndex = -1;
                }
              },
              nullifiable: true,
              onMouseenter: () => {
                if (groupByGridColumns) drawgroupByGrid(groupByGridColumns);
              },
              onMousedown: () => {
                groupByGridActive = true;
                if (groupByGridColumns) drawgroupByGrid(groupByGridColumns);
              },
              onMouseleave: function onMouseup() {
                if (!groupByGridActive) {
                  cleargroupByGrid();
                  groupByGrid.style.zIndex = -1;
                }
              },
              onMouseup: function onMouseup() {
                groupByGridActive = false;
                cleargroupByGrid();
                groupByGrid.style.zIndex = -1;
              }
            }
          ]
        },
        {
          name: 'Overlap',
          width: '4rem',
          action: () => {
            pilingLib.groupBy('overlap', groupByOverlapSqPx);
          },
          subInputs: [
            {
              dtype: 'int',
              min: 1,
              max: 256,
              defaultValue: 1,
              onInput: true,
              setter: sqPx => {
                groupByOverlapSqPx = sqPx;
              }
            }
          ]
        },
        {
          name: 'Distance',
          width: '4rem',
          action: () => {
            pilingLib.groupBy('distance', groupByDistancePx);
          },
          subInputs: [
            {
              dtype: 'int',
              min: 1,
              max: 256,
              defaultValue: 1,
              onInput: true,
              setter: px => {
                groupByDistancePx = px;
              }
            }
          ]
        },
        {
          name: 'Category',
          hide: categoricalProps.length === 0,
          width: '4rem',
          dtype: null,
          subInputs: [
            {
              name: 'Group',
              action: () => {
                pilingLib.groupBy('category', groupByCategory);
              }
            },
            {
              name: 'Split',
              action: () => {
                pilingLib.splitBy('category', groupByCategory);
              }
            },
            {
              dtype: 'string',
              values: categoricalProps,
              defaultValue: groupByCategory,
              setter: category => {
                groupByCategory = category;
              }
            }
          ]
        },
        {
          name: 'Split All',
          action: () => {
            pilingLib.splitAll();
          }
        }
      ]
    },
    {
      id: 'label',
      title: 'Label',
      fields: [
        {
          name: 'Pile properties',
          propName: 'pileLabel',
          hide: categoricalProps.length === 0,
          labelMinWidth: '4rem',
          dtype: 'string',
          values: categoricalProps,
          multiple: true,
          nullifiable: true
        },
        {
          name: 'Show text label',
          propName: 'pileLabelText',
          hide: categoricalProps.length === 0 || pileLabelTextDisable,
          labelMinWidth: '4rem',
          dtype: 'boolean',
          nullifiable: true
        },
        {
          name: 'Alignment',
          propName: 'pileLabelAlign',
          hide: categoricalProps.length === 0,
          labelMinWidth: '6.25rem',
          dtype: 'string',
          values: ['top', 'bottom'],
          dropDown: true,
          defaultValue: piling.get('pileLabelAlign')
        },
        {
          name: 'Stack direction',
          propName: 'pileLabelStackAlign',
          hide: categoricalProps.length === 0,
          labelMinWidth: '6.25rem',
          dtype: 'string',
          values: ['horizontal', 'vertical'],
          dropDown: true,
          defaultValue: piling.get('pileLabelStackAlign')
        },
        {
          name: 'Font size',
          propName: 'pileLabelFontSize',
          hide: categoricalProps.length === 0,
          labelMinWidth: '6rem',
          dtype: 'int',
          min: 0,
          max: 16
        },
        {
          name: 'Height',
          propName: 'pileLabelHeight',
          hide:
            categoricalProps.length === 0 ||
            isFunction(piling.get('pileLabelHeight')),
          labelMinWidth: '6rem',
          dtype: 'int',
          min: 0.1,
          max: 16,
          numSteps: 159
        },
        {
          name: 'Show size badge',
          propName: 'pileSizeBadge',
          hide: isFunction(piling.get('pileSizeBadge')),
          labelMinWidth: '6rem',
          dtype: 'boolean'
        },
        {
          name: 'Size badge align',
          hide: isFunction(piling.get('pileSizeBadgeAlign')),
          width: '6rem',
          dtype: null,
          subInputs: [
            {
              dtype: 'string',
              values: ['top', 'center', 'bottom'],
              defaultValue: pileSizeBadgeAlignY,
              setter: yAlign => {
                pileSizeBadgeAlignY = yAlign;
                piling.set('pileSizeBadgeAlign', [
                  pileSizeBadgeAlignY,
                  pileSizeBadgeAlignX
                ]);
              }
            },
            {
              dtype: 'string',
              values: ['left', 'center', 'right'],
              defaultValue: pileSizeBadgeAlignX,
              setter: xAlign => {
                pileSizeBadgeAlignX = xAlign;
                piling.set('pileSizeBadgeAlign', [
                  pileSizeBadgeAlignY,
                  pileSizeBadgeAlignX
                ]);
              }
            }
          ]
        }
      ]
    },
    ...additionalOptions
  ];

  const dtypeToInputType = {
    boolean: 'checkbox',
    int: 'number',
    float: 'number',
    string: 'text'
  };

  const parseDtype = {
    boolean: v => !!v,
    int: v => +v,
    float: v => +v,
    string: v => v
  };

  const createInput = (field, isSub = false) => {
    const currentValue =
      !Number.isNaN(+field.defaultValue) || field.defaultValue
        ? field.defaultValue
        : field.propName && pilingLib.get(field.propName);

    if (field.action) {
      const button = document.createElement('button');
      button.className = 'button';
      button.textContent = field.name;
      if (field.width) button.style.minWidth = field.width;
      return button;
    }

    if (field.values) {
      if (field.multiple) {
        const checkboxes = document.createElement('div');
        checkboxes.className =
          field.values.length > 5 ? 'checkboxes scrollbar' : 'checkboxes';

        field.values.forEach(value => {
          const checkboxLabel = document.createElement('label');
          checkboxLabel.className = 'checkbox';
          checkboxes.appendChild(checkboxLabel);

          const checkbox = document.createElement('input');
          checkbox.setAttribute('type', 'checkbox');
          checkbox.setAttribute('value', value);
          if (currentValue === value) checkbox.selected = true;
          checkboxLabel.appendChild(checkbox);

          const checkboxLabelText = document.createElement('span');
          checkboxLabelText.textContent = value;
          checkboxLabel.appendChild(checkboxLabelText);
        });

        Object.defineProperty(checkboxes, 'value', {
          get: () =>
            Array.from(
              checkboxes.querySelectorAll('input:checked'),
              e => e.value
            )
        });

        checkboxes.addEventListener = (type, callback) => {
          Array.prototype.forEach.call(
            checkboxes.querySelectorAll('input'),
            checkbox => {
              checkbox.addEventListener(type, callback);
            }
          );
        };

        return checkboxes;
      }

      if (field.values.length > 3 || isSub || field.dropDown) {
        const select = document.createElement('select');

        field.values.forEach((value, i) => {
          const option = document.createElement('option');
          option.setAttribute('value', value);
          option.textContent = (field.labels && field.labels[i]) || value;
          if (currentValue === value) option.selected = true;
          select.appendChild(option);
        });

        if (field.multiple) {
          select.setAttribute('multiple', 'multiple');

          Object.defineProperty(select, 'value', {
            get: () => {
              return Array.from(
                select.querySelectorAll('option:checked'),
                e => e.value
              );
            }
          });
        } else {
          Object.defineProperty(select, 'value', {
            get: () => select.options[select.selectedIndex].value
          });
        }

        return select;
      }

      const radios = document.createElement('div');

      field.values.forEach(value => {
        const radioLabel = document.createElement('label');
        radioLabel.className = 'radio';
        radios.appendChild(radioLabel);

        const radio = document.createElement('input');
        radio.setAttribute('type', 'radio');
        radio.setAttribute('name', field.name);
        radio.setAttribute('value', value);

        if (currentValue === value) radio.checked = true;
        radioLabel.appendChild(radio);

        const radioLabelText = document.createElement('span');
        radioLabelText.textContent = value;
        radioLabel.appendChild(radioLabelText);
      });

      Object.defineProperty(radios, 'value', {
        get: () => radios.querySelector('input:checked').value
      });

      radios.addEventListener = (type, callback) => {
        Array.prototype.forEach.call(
          radios.querySelectorAll('input'),
          radio => {
            radio.addEventListener(type, callback);
          }
        );
      };

      return radios;
    }

    const input = document.createElement('input');
    if (field.id) input.id = field.id;
    input.setAttribute('type', dtypeToInputType[field.dtype]);

    if (!Number.isNaN(+field.min)) {
      input.setAttribute('type', 'range');
      input.setAttribute('min', +field.min);
      input.className = 'range-slider';
    }

    if (!Number.isNaN(+field.max)) {
      input.setAttribute('type', 'range');
      input.setAttribute('max', +field.max);
      input.className = 'range-slider';
    }

    if (!Number.isNaN(+field.numSteps)) {
      const step = (+field.max - +field.min) / +field.numSteps;
      input.setAttribute('type', 'range');
      input.setAttribute('step', step);
      input.className = 'range-slider';
    }

    input.setAttribute('value', currentValue);

    if (field.class) {
      input.className = `${input.className} ${field.class}`;
    }

    return input;
  };

  const addListeners = (input, field, valueEl) => {
    const outElements = [];
    let isSet = { checked: true }; // Just a dummy

    if (!field.action) {
      isSet = document.createElement('input');
      isSet.setAttribute('type', 'checkbox');
      if (field.nullifiable) {
        if (
          field.propName &&
          pilingLib.get(field.propName) !== undefined &&
          pilingLib.get(field.propName) !== null
        ) {
          isSet.checked = true;
        }
        isSet.addEventListener('change', event => {
          if (event.target.checked) {
            const value = field.dtype && parseDtype[field.dtype](input.value);

            if (field.setter) {
              field.setter(value);
            } else if (field.action) {
              field.action(value);
            } else {
              pilingLib.set(field.propName, value);
            }

            if (field.dtype === 'int' && (field.min || field.max)) {
              valueEl.textContent = value;
            }
          } else {
            if (field.setter) {
              field.setter(null);
            } else {
              pilingLib.set(field.propName, null);
            }
            valueEl.textContent = '';
          }
        });
      } else {
        isSet.checked = true;
        isSet.disabled = true;
        if (field.hideCheckbox) {
          isSet.style.display = 'none';
        }
      }

      if (
        !(field.values && (field.multiple || !field.nullifiable)) &&
        field.dtype !== 'boolean'
      ) {
        outElements.push(isSet);
      }
    }

    let eventType = 'change';
    if (field.onInput) eventType = 'input';
    if (field.action) eventType = 'click';

    input.addEventListener(eventType, event => {
      let value = event.target.value;

      if (field.values && field.multiple) {
        value = input.value;
        isSet.checked = value.length;
      }

      if (field.dtype === 'boolean') {
        value = event.target.checked;
        if (field.setter) {
          field.setter(value);
        } else {
          pilingLib.set(field.propName, value);
        }
      } else if (isSet && isSet.checked) {
        value = field.dtype && parseDtype[field.dtype](value);

        if (field.setter) {
          field.setter(value);
        } else if (field.action) {
          field.action(value);
        } else {
          pilingLib.set(field.propName, value);
        }

        if (field.dtype === 'int' && (field.min || field.max)) {
          valueEl.textContent = value;
        }
      } else if (field.nullifiable) {
        if (field.setter) {
          field.setter(null);
        } else {
          pilingLib.set(field.propName, null);
        }
      }
    });

    if (field.onMouseenter)
      input.addEventListener('mouseenter', field.onMouseenter);
    if (field.onMouseleave)
      input.addEventListener('mouseleave', field.onMouseleave);
    if (field.onMousedown)
      input.addEventListener('mousedown', field.onMousedown);
    if (field.onMouseup) input.addEventListener('mouseup', field.onMouseup);

    return outElements;
  };

  const optionsContent = document.querySelector('#options .content');
  options.forEach(section => {
    const validFields = section.fields.filter(
      field => typeof field.values === 'undefined' || field.values.length
    );

    if (!validFields.length) return;

    const sectionEl = document.createElement('section');
    sectionEl.id = section.id;
    optionsContent.appendChild(sectionEl);

    const headline = document.createElement('h4');
    headline.textContent = section.title;
    sectionEl.appendChild(headline);

    const fields = document.createElement('div');
    fields.setAttribute('class', 'fields');
    sectionEl.appendChild(fields);

    validFields
      .filter(field => !field.hide)
      .forEach(field => {
        const label = document.createElement('div');
        label.className = 'label-wrapper';
        const labelTitle = document.createElement('div');
        labelTitle.className = 'label-title';

        const title = document.createElement('span');
        title.setAttribute('class', 'title');
        title.textContent = field.name;
        labelTitle.appendChild(title);

        const valueEl = document.createElement('span');
        valueEl.setAttribute('class', 'value');

        const inputWrapper = document.createElement('div');
        inputWrapper.className = `input-wrapper ${
          field.subInput ? 'with-sub-inputs' : ''
        }`;
        const inputs = document.createElement('div');
        inputs.className = 'inputs';

        if (
          !field.multiple &&
          (!field.values || field.values.length > 3 || field.dropDown)
        ) {
          if (field.labelMinWidth) {
            labelTitle.style.minWidth = field.labelMinWidth;
          }
          inputs.appendChild(labelTitle);
        } else {
          label.appendChild(labelTitle);
        }

        const input = createInput(field);
        const subInputs = field.subInputs
          ? field.subInputs.map(subInput => createInput(subInput, true))
          : [];

        let newElements;

        if (field.dtype !== null) {
          newElements = addListeners(input, field, valueEl);
          newElements.forEach(el => inputs.appendChild(el));
          inputs.appendChild(input);
          if (field.dtype === 'int' && (field.min || field.max)) {
            inputs.appendChild(valueEl);
            valueEl.textContent =
              field.defaultValue !== undefined
                ? field.defaultValue
                : field.propName && pilingLib.get(field.propName);
          }
        }

        subInputs.forEach((subInput, i) => {
          const subInputField = field.subInputs[i];
          newElements = addListeners(subInput, subInputField, valueEl, true);
          newElements.forEach(el => inputs.appendChild(el));
          inputs.appendChild(subInput);
          if (
            subInputField.dtype === 'int' &&
            (subInputField.min || subInputField.max)
          ) {
            inputs.appendChild(valueEl);
            valueEl.textContent =
              subInputField.defaultValue !== undefined
                ? subInputField.defaultValue
                : field.propName && pilingLib.get(field.propName);
          }
        });

        if (field.action) {
          labelTitle.style.display = 'none';
        }

        inputWrapper.appendChild(inputs);
        label.appendChild(inputWrapper);
        fields.appendChild(label);
      });
  });
});
