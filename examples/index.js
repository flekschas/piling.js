import createPhotoPiles from './photos';
import createMatrixPiles from './matrices';
import createSvgLinesPiles from './lines';
import createScatterplotPiles from './scatterplots';
import createDrawingPiles from './drawings';
import createVitessce from './vitessce';
import createJoyPlotPiles from './joy-plot';
import createTimeSeriesPiles from './time-series';

import './index.scss';

const photosEl = document.getElementById('photos');
const matricesEl = document.getElementById('matrices');
const svgEl = document.getElementById('svg');
const scatterplotsEl = document.getElementById('scatterplots');
const drawingsEl = document.getElementById('drawings');
const vitessceEl = document.getElementById('vitessce');
const joyplotEl = document.getElementById('joyplot');
const timeseriesEl = document.getElementById('timeseries');

const photosCreditEl = document.getElementById('photos-credit');
const matricesCreditEl = document.getElementById('matrices-credit');
const svgCreditEl = document.getElementById('svg-credit');
const scatterplotsCreditEl = document.getElementById('scatterplots-credit');
const drawingsCreditEl = document.getElementById('drawings-credit');
const vitessceCreditEl = document.getElementById('vitessce-credit');
const joyplotCreditEl = document.getElementById('joyplot-credit');
const timeseriesCreditEl = document.getElementById('timeseries-credit');

const conditionalElements = [
  photosEl,
  matricesEl,
  svgEl,
  scatterplotsEl,
  drawingsEl,
  vitessceEl,
  joyplotEl,
  timeseriesEl,
  photosCreditEl,
  matricesCreditEl,
  svgCreditEl,
  scatterplotsCreditEl,
  drawingsCreditEl,
  vitessceCreditEl,
  joyplotCreditEl,
  timeseriesCreditEl
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

const hideEl = el => {
  el.style.display = 'none';
};

const pilingEls = {
  photos: photosEl,
  matrices: matricesEl,
  lines: svgEl,
  drawings: drawingsEl,
  joyplot: joyplotEl,
  vitessce: vitessceEl,
  scatterplots: scatterplotsEl
};
const createPiles = async example => {
  let additionalOptions;

  switch (example) {
    case 'photos':
      if (piling) piling.destroy();
      conditionalElements.forEach(hideEl);
      photosEl.style.display = 'block';
      photosCreditEl.style.display = 'block';
      undoButton.disabled = true;
      [piling, additionalOptions] = await createPhotoPiles(photosEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    case 'matrices':
      if (piling) piling.destroy();
      conditionalElements.forEach(hideEl);
      matricesEl.style.display = 'block';
      matricesCreditEl.style.display = 'block';
      undoButton.disabled = true;
      [piling, additionalOptions] = await createMatrixPiles(matricesEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    case 'lines':
      if (piling) piling.destroy();
      conditionalElements.forEach(hideEl);
      svgEl.style.display = 'block';
      svgCreditEl.style.display = 'block';
      undoButton.disabled = true;
      [piling, additionalOptions] = await createSvgLinesPiles(svgEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    case 'drawings':
      if (piling) piling.destroy();
      conditionalElements.forEach(hideEl);
      drawingsEl.style.display = 'block';
      drawingsCreditEl.style.display = 'block';
      undoButton.disabled = true;
      [piling, additionalOptions] = await createDrawingPiles(drawingsEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    case 'joyplot':
      if (piling) piling.destroy();
      conditionalElements.forEach(hideEl);
      joyplotEl.style.display = 'block';
      joyplotCreditEl.style.display = 'block';
      undoButton.disabled = true;
      piling = await createJoyPlotPiles(joyplotEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    case 'vitessce':
      if (piling) piling.destroy();
      conditionalElements.forEach(hideEl);
      vitessceEl.style.display = 'block';
      vitessceCreditEl.style.display = 'block';
      undoButton.disabled = true;
      [piling, additionalOptions] = await createVitessce(vitessceEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    case 'scatterplots':
      if (piling) piling.destroy();
      conditionalElements.forEach(hideEl);
      scatterplotsEl.style.display = 'block';
      scatterplotsCreditEl.style.display = 'block';
      undoButton.disabled = true;
      piling = await createScatterplotPiles(scatterplotsEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    case 'timeseries':
      if (piling) piling.destroy();
      conditionalElements.forEach(hideEl);
      timeseriesEl.style.display = 'block';
      timeseriesCreditEl.style.display = 'block';
      undoButton.disabled = true;
      [piling, additionalOptions] = await createTimeSeriesPiles(timeseriesEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    default:
      console.warn('Unknown example:', example);
      break;
  }

  return [piling, additionalOptions];
};

const exampleEl = document.getElementById('example');

exampleEl.addEventListener('change', event => {
  urlQueryParams.set('example', event.target.value);
  window.location.search = urlQueryParams.toString();
});

const example = urlQueryParams.get('example')
  ? urlQueryParams
      .get('example')
      .split(' ')[0]
      .toLowerCase()
  : null;

switch (example) {
  case 'photos':
    exampleEl.selectedIndex = 0;
    break;

  case 'matrices':
    exampleEl.selectedIndex = 1;
    break;

  case 'lines':
    exampleEl.selectedIndex = 2;
    break;

  case 'drawings':
    exampleEl.selectedIndex = 3;
    break;

  case 'joyplot':
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

  default:
  // Nothing
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

createPiles(exampleEl.value).then(([pilingLib, additionalOptions = []]) => {
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

  const pileByGrid = document.body.querySelector('#group-by-grid');
  const pileByGridCanvas = pileByGrid.querySelector('canvas');
  const pileByGridCtx = pileByGridCanvas.getContext('2d');
  let pileByGridColumns = null;
  let pileByGridActive = false;

  const pilingScrollEl = pilingEls[exampleEl.value].querySelector('div');

  const clearPileByGrid = () => {
    pileByGridCtx.clearRect(0, 0, pileByGridCtx.width, pileByGridCtx.height);
  };

  const drawPileByGrid = columns => {
    pileByGrid.style.zIndex = 1;
    const { width, height } = pileByGridCanvas.getBoundingClientRect();
    const res = window.devicePixelRatio;
    pileByGridCanvas.width = width * res;
    pileByGridCanvas.height = height * res;

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

    clearPileByGrid();

    pileByGridCtx.strokeStyle = '#ff7ff6';
    pileByGridCtx.beginPath();

    for (let i = 1; i < numRows; i++) {
      pileByGridCtx.moveTo(0, i * rowHeight * res - offsetY * res);
      pileByGridCtx.lineTo(width * res, i * rowHeight * res - offsetY * res);
    }

    for (let j = 1; j < numColumns; j++) {
      pileByGridCtx.moveTo(j * columnWidth * res, 0);
      pileByGridCtx.lineTo(j * columnWidth * res, height * res);
    }

    pileByGridCtx.stroke();
  };

  let pileByRow = 'center';
  let pileByColumn = 'top';
  let pileByOverlapSqPx = 1;
  let pileByDistancePx = 1;
  let pileByCategory;

  const options = [
    {
      id: 'grid',
      title: 'Grid',
      fields: [
        {
          name: 'itemSize',
          dtype: 'int',
          min: 16,
          max: 320,
          numSteps: 16,
          nullifiable: true
        },
        {
          name: 'cellPadding',
          dtype: 'int',
          min: 0,
          max: 64,
          numSteps: 8
        },
        {
          name: 'columns',
          dtype: 'int',
          min: 1,
          max: 20,
          nullifiable: true
        },
        {
          name: 'rowHeight',
          dtype: 'int',
          min: 16,
          max: 320,
          numSteps: 16,
          nullifiable: true
        },
        {
          name: 'cellAspectRatio',
          dtype: 'float',
          nullifiable: true
        },
        {
          name: 'pileCellAlignment',
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
          name: 'arrangementObjective',
          dtype: 'string',
          values: numericalProps,
          setter: values =>
            values && values.length
              ? pilingLib.arrangeBy('data', values)
              : pilingLib.arrangeBy(),
          multiple: true,
          nullifiable: true
        },
        {
          name: 'navigationMode',
          dtype: 'string',
          values: ['auto', 'panZoom', 'scroll']
        }
      ]
    },
    {
      id: 'piling',
      title: 'Pile By...',
      fields: [
        {
          name: 'Row',
          width: '4rem',
          onClick: true,
          action: () => {
            pilingLib.pileBy('row', pileByRow);
          },
          subInput: {
            dtype: 'string',
            values: ['left', 'center', 'right'],
            defaultValue: pileByRow,
            setter: direction => {
              pileByRow = direction;
            }
          }
        },
        {
          name: 'Column',
          width: '4rem',
          onClick: true,
          action: () => {
            pilingLib.pileBy('column', pileByColumn);
          },
          subInput: {
            dtype: 'string',
            values: ['top', 'center', 'bottom'],
            defaultValue: pileByColumn,
            setter: direction => {
              pileByColumn = direction;
            }
          }
        },
        {
          name: 'Grid',
          width: '4rem',
          onClick: true,
          action: () => {
            const objective =
              pileByGridColumns !== null
                ? { columns: pileByGridColumns }
                : undefined;
            pilingLib.pileBy('grid', objective);
          },
          onMouseenter: () => {
            drawPileByGrid(pileByGridColumns);
          },
          onMousedown: () => {
            pileByGridActive = true;
            if (pileByGridColumns) drawPileByGrid(pileByGridColumns);
          },
          onMouseleave: function onMouseup() {
            if (!pileByGridActive) {
              clearPileByGrid();
              pileByGrid.style.zIndex = -1;
            }
          },
          onMouseup: function onMouseup() {
            pileByGridActive = false;
            clearPileByGrid();
            pileByGrid.style.zIndex = -1;
          },
          subInput: {
            name: 'Pile by grid: # columns',
            dtype: 'int',
            min: 1,
            max: 20,
            onInput: true,
            setter: columns => {
              pileByGridColumns = columns;
              if (pileByGridActive && columns !== null) {
                drawPileByGrid(columns);
              } else {
                clearPileByGrid();
                pileByGrid.style.zIndex = -1;
              }
            },
            nullifiable: true,
            onMouseenter: () => {
              if (pileByGridColumns) drawPileByGrid(pileByGridColumns);
            },
            onMousedown: () => {
              pileByGridActive = true;
              if (pileByGridColumns) drawPileByGrid(pileByGridColumns);
            },
            onMouseleave: function onMouseup() {
              if (!pileByGridActive) {
                clearPileByGrid();
                pileByGrid.style.zIndex = -1;
              }
            },
            onMouseup: function onMouseup() {
              pileByGridActive = false;
              clearPileByGrid();
              pileByGrid.style.zIndex = -1;
            }
          }
        },
        {
          name: 'Overlap',
          width: '4rem',
          onClick: true,
          action: () => {
            pilingLib.pileBy('overlap', pileByOverlapSqPx);
          },
          subInput: {
            name: 'Min overlap in pixel^2',
            dtype: 'int',
            min: 1,
            max: 256,
            defaultValue: 1,
            onInput: true,
            setter: sqPx => {
              pileByOverlapSqPx = sqPx;
            }
          }
        },
        {
          name: 'Distance',
          width: '4rem',
          onClick: true,
          action: () => {
            pilingLib.pileBy('distance', pileByDistancePx);
          },
          subInput: {
            name: 'Min distance in pixel',
            dtype: 'int',
            min: 1,
            max: 256,
            defaultValue: 1,
            onInput: true,
            setter: px => {
              pileByDistancePx = px;
            }
          }
        },
        {
          name: 'Category',
          hide: categoricalProps.length === 0,
          onClick: true,
          width: '4rem',
          action: () => {
            pilingLib.pileBy('category', pileByCategory);
          },
          subInput: {
            name: 'Category',
            dtype: 'string',
            values: categoricalProps,
            setter: category => {
              pileByCategory = category;
            }
          }
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
        : pilingLib.get(field.name);

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

      if (field.values.length > 3 || isSub) {
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
          pilingLib.get(field.name) !== undefined &&
          pilingLib.get(field.name) !== null
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
              pilingLib.set(field.name, value);
            }

            if (field.dtype === 'int' && (field.min || field.max)) {
              valueEl.textContent = value;
            }
          } else {
            if (field.setter) {
              field.setter(null);
            } else {
              pilingLib.set(field.name, null);
            }
            valueEl.textContent = '';
          }
        });
      } else {
        isSet.checked = true;
        isSet.disabled = true;
      }

      if (!(field.values && (field.multiple || !field.nullifiable))) {
        outElements.push(isSet);
      }
    }

    let eventType = 'change';
    if (field.onInput) eventType = 'input';
    if (field.onClick) eventType = 'click';

    input.addEventListener(eventType, event => {
      let value = event.target.value;

      if (field.values && field.multiple) {
        value = input.value;
        isSet.checked = value.length;
      }

      if (isSet && isSet.checked) {
        value = field.dtype && parseDtype[field.dtype](value);

        if (field.setter) {
          field.setter(value);
        } else if (field.action) {
          field.action(value);
        } else {
          pilingLib.set(field.name, value);
        }

        if (field.dtype === 'int' && (field.min || field.max)) {
          valueEl.textContent = value;
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
        label.appendChild(labelTitle);

        const valueEl = document.createElement('span');
        valueEl.setAttribute('class', 'value');

        const inputWrapper = document.createElement('div');
        inputWrapper.className = `input-wrapper ${
          field.subInput ? 'with-sub-inputs' : ''
        }`;
        const inputs = document.createElement('div');
        inputs.className = 'inputs';

        const input = createInput(field);
        const subInput = field.subInput && createInput(field.subInput, true);

        let newElements = addListeners(input, field, valueEl);

        newElements.forEach(el => inputs.appendChild(el));
        inputs.appendChild(input);
        if (field.dtype === 'int' && (field.min || field.max)) {
          inputs.appendChild(valueEl);
          valueEl.textContent =
            field.defaultValue !== undefined
              ? field.defaultValue
              : pilingLib.get(field.name);
        }

        if (subInput) {
          newElements = addListeners(subInput, field.subInput, valueEl, true);
          newElements.forEach(el => inputs.appendChild(el));
          inputs.appendChild(subInput);
          if (
            field.subInput.dtype === 'int' &&
            (field.subInput.min || field.subInput.max)
          ) {
            inputs.appendChild(valueEl);
            valueEl.textContent =
              field.subInput.defaultValue !== undefined
                ? field.subInput.defaultValue
                : pilingLib.get(field.name);
          }
        }

        if (field.action) {
          labelTitle.style.display = 'none';
        }

        inputWrapper.appendChild(inputs);
        label.appendChild(inputWrapper);
        fields.appendChild(label);
      });
  });
});
