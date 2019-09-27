import createPhotoPiles from './photos';
import createMatrixPiles from './matrices';
import createSvgPiles from './svg';

const photosEl = document.getElementById('photos');
const matricesEl = document.getElementById('matrices');
const svgEl = document.getElementById('svg');
const photosCreditEl = document.getElementById('photos-credit');
const matricesCreditEl = document.getElementById('matrices-credit');
const svgCreditEl = document.getElementById('svg-credit');

let pileJs;

const urlQueryParams = new URLSearchParams(window.location.search);

const createPiles = async example => {
  switch (example) {
    case 'photos':
      if (pileJs) pileJs.destroy();
      matricesEl.style.display = 'none';
      matricesCreditEl.style.display = 'none';
      svgEl.style.display = 'none';
      svgCreditEl.style.display = 'none';
      photosEl.style.display = 'block';
      photosCreditEl.style.display = 'block';
      pileJs = await createPhotoPiles(photosEl);
      break;

    case 'matrices':
      if (pileJs) pileJs.destroy();
      photosEl.style.display = 'none';
      photosCreditEl.style.display = 'none';
      svgEl.style.display = 'none';
      svgCreditEl.style.display = 'none';
      matricesEl.style.display = 'block';
      matricesCreditEl.style.display = 'block';
      pileJs = await createMatrixPiles(matricesEl);
      break;

    case 'svg':
      if (pileJs) pileJs.destroy();
      photosEl.style.display = 'none';
      photosCreditEl.style.display = 'none';
      matricesEl.style.display = 'none';
      matricesCreditEl.style.display = 'none';
      svgEl.style.display = 'block';
      svgCreditEl.style.display = 'block';
      pileJs = await createSvgPiles(svgEl);
      break;

    default:
      console.warn('Unknown example:', example);
      break;
  }
};

const exampleEl = document.getElementById('example');

const handleExample = event => createPiles(event.target.value);

exampleEl.addEventListener('change', handleExample);

const example = urlQueryParams.get('example')
  ? urlQueryParams.get('example').toLowerCase()
  : null;

if (example) exampleEl.value = example;

createPiles(exampleEl.value);
