import createPhotoPiles from './photos';
import createMatrixPiles from './matrices';
import createSvgLinesPiles from './lines';

const photosEl = document.getElementById('photos');
const matricesEl = document.getElementById('matrices');
const svgEl = document.getElementById('svg');
const photosCreditEl = document.getElementById('photos-credit');
const matricesCreditEl = document.getElementById('matrices-credit');
const svgCreditEl = document.getElementById('svg-credit');
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
  piling.importState(history[history.length - 1]);
  if (history.length === 0) undoButton.disabled = true;
};

undoButton.addEventListener('click', undoHandler);

const ignoredActions = new Set([
  'OVERWRITE',
  'SOFT_OVERWRITE',
  'SET_CLICKED_PILE'
]);

const updateHandler = ({ action }) => {
  if (ignoredActions.has(action.type)) return;

  undoButton.disabled = false;

  const state = piling.exportState();
  history.push(state);

  console.log('Update', action.type, history.length);

  if (history.length > 5) history.shift();
};

const createPiles = async example => {
  switch (example) {
    case 'photos':
      if (piling) piling.destroy();
      matricesEl.style.display = 'none';
      matricesCreditEl.style.display = 'none';
      svgEl.style.display = 'none';
      svgCreditEl.style.display = 'none';
      photosEl.style.display = 'block';
      photosCreditEl.style.display = 'block';
      undoButton.disabled = true;
      piling = await createPhotoPiles(photosEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    case 'matrices':
      if (piling) piling.destroy();
      photosEl.style.display = 'none';
      photosCreditEl.style.display = 'none';
      svgEl.style.display = 'none';
      svgCreditEl.style.display = 'none';
      matricesEl.style.display = 'block';
      matricesCreditEl.style.display = 'block';
      undoButton.disabled = true;
      piling = await createMatrixPiles(matricesEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    case 'lines':
      if (piling) piling.destroy();
      photosEl.style.display = 'none';
      photosCreditEl.style.display = 'none';
      matricesEl.style.display = 'none';
      matricesCreditEl.style.display = 'none';
      svgEl.style.display = 'block';
      svgCreditEl.style.display = 'block';
      undoButton.disabled = true;
      piling = await createSvgLinesPiles(svgEl);
      history = [];
      piling.subscribe('update', updateHandler);
      break;

    default:
      console.warn('Unknown example:', example);
      break;
  }

  return piling;
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

  default:
  // Nothing
}

let isOptionsOpen = false;

const handleOptionsTogglerClick = event => {
  event.preventDefault();

  isOptionsOpen = !isOptionsOpen;

  if (isOptionsOpen) {
    optionsEl.setAttribute('class', 'open');
    document.body.setAttribute('class', `${window.example} options-open`);
  } else {
    optionsEl.removeAttribute('class');
    document.body.setAttribute('class', window.example);
  }
};

optionsTogglerEl.addEventListener('click', handleOptionsTogglerClick);

createPiles(exampleEl.value).then(pilingLib => {
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
          steps: 16,
          nullifiable: true
        },
        {
          name: 'itemPadding',
          dtype: 'int',
          min: 0,
          max: 64,
          steps: 8
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
          steps: 16,
          nullifiable: true
        },
        {
          name: 'cellAspectRatio',
          dtype: 'float',
          nullifiable: true
        },
        {
          name: 'pileCellAlign',
          dtype: 'string',
          values: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center']
        }
      ]
    }
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

  const createInput = field => {
    const currentValue = pilingLib.get(field.name);

    if (field.values) {
      const select = document.createElement('select');
      field.values.forEach(value => {
        const option = document.createElement('option');
        option.setAttribute('value', value);
        option.textContent = value;
        if (currentValue === value) option.selected = true;
        select.appendChild(option);
      });

      Object.defineProperty(select, 'value', {
        get: () => select.options[select.selectedIndex].value
      });

      return select;
    }

    const input = document.createElement('input');
    input.setAttribute('type', dtypeToInputType[field.dtype]);

    if (!Number.isNaN(+field.min)) {
      input.setAttribute('type', 'range');
      input.setAttribute('min', +field.min);
    }

    if (!Number.isNaN(+field.max)) {
      input.setAttribute('type', 'range');
      input.setAttribute('max', +field.max);
    }

    if (!Number.isNaN(+field.step)) {
      input.setAttribute('type', 'range');
      input.setAttribute('step', +field.step);
    }

    input.setAttribute('value', currentValue);

    return input;
  };

  const optionsContent = document.querySelector('#options .content');
  options.forEach(section => {
    const sectionEl = document.createElement('section');
    sectionEl.id = section.id;
    optionsContent.appendChild(sectionEl);

    const headline = document.createElement('h4');
    headline.textContent = section.title;
    sectionEl.appendChild(headline);

    const fields = document.createElement('div');
    fields.setAttribute('class', 'fields');
    sectionEl.appendChild(fields);

    section.fields.forEach(field => {
      const label = document.createElement('label');
      const labelTitle = document.createElement('div');

      const title = document.createElement('span');
      title.setAttribute('class', 'title');
      title.textContent = field.name;
      labelTitle.appendChild(title);
      label.appendChild(labelTitle);

      const value = document.createElement('span');
      value.setAttribute('class', 'value');
      value.textContent = pilingLib.get(field.name);
      labelTitle.appendChild(value);

      const inputs = document.createElement('inputs');
      inputs.setAttribute('class', 'inputs');
      const input = createInput(field);

      const isSet = document.createElement('input');
      isSet.setAttribute('type', 'checkbox');
      if (field.nullifiable) {
        if (pilingLib.get(field.name) !== null) {
          isSet.checked = true;
        }
        isSet.addEventListener('change', event => {
          if (event.target.checked) {
            pilingLib.set(field.name, parseDtype[field.dtype](input.value));
            value.textContent = parseDtype[field.dtype](input.value);
          } else {
            pilingLib.set(field.name, null);
            value.textContent = '';
          }
        });
      } else {
        isSet.checked = true;
        isSet.disabled = true;
      }
      inputs.appendChild(isSet);

      input.addEventListener('change', event => {
        if (isSet && isSet.checked) {
          const newValue = parseDtype[field.dtype](event.target.value);
          pilingLib.set(field.name, newValue);
          value.textContent = newValue;
        }
      });

      inputs.appendChild(input);
      label.appendChild(inputs);
      fields.appendChild(label);
    });
  });
});
