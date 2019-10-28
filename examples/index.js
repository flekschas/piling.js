import createPhotoPiles from './photos';
import createMatrixPiles from './matrices';
import createSvgLinesPiles from './lines';

const photosEl = document.getElementById('photos');
const matricesEl = document.getElementById('matrices');
const svgEl = document.getElementById('svg');
const photosCreditEl = document.getElementById('photos-credit');
const matricesCreditEl = document.getElementById('matrices-credit');
const svgCreditEl = document.getElementById('svg-credit');

let piling;

const urlQueryParams = new URLSearchParams(window.location.search);

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
      piling = await createPhotoPiles(photosEl);
      break;

    case 'matrices':
      if (piling) piling.destroy();
      photosEl.style.display = 'none';
      photosCreditEl.style.display = 'none';
      svgEl.style.display = 'none';
      svgCreditEl.style.display = 'none';
      matricesEl.style.display = 'block';
      matricesCreditEl.style.display = 'block';
      piling = await createMatrixPiles(matricesEl);
      break;

    case 'lines':
      if (piling) piling.destroy();
      photosEl.style.display = 'none';
      photosCreditEl.style.display = 'none';
      matricesEl.style.display = 'none';
      matricesCreditEl.style.display = 'none';
      svgEl.style.display = 'block';
      svgCreditEl.style.display = 'block';
      piling = await createSvgLinesPiles(svgEl);
      break;

    default:
      console.warn('Unknown example:', example);
      break;
  }
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

createPiles(exampleEl.value);
