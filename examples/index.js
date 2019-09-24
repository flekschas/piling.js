import createPhotoPiles from './photos';
import createMatrixPiles from './matrices';

const photosEl = document.getElementById('photos');
const matricesEl = document.getElementById('matrices');
const photosCreditEl = document.getElementById('photos-credit');
const matricesCreditEl = document.getElementById('matrices-credit');

let pileJs;

const createPiles = async example => {
  switch (example) {
    case 'photos':
      if (pileJs) pileJs.destroy();
      matricesEl.style.display = 'none';
      matricesCreditEl.style.display = 'none';
      photosEl.style.display = 'block';
      photosCreditEl.style.display = 'block';
      pileJs = await createPhotoPiles(photosEl);
      break;

    case 'matrices':
      if (pileJs) pileJs.destroy();
      photosEl.style.display = 'none';
      photosCreditEl.style.display = 'none';
      matricesEl.style.display = 'block';
      matricesCreditEl.style.display = 'block';
      pileJs = await createMatrixPiles(matricesEl);
      break;

    default:
      console.warn('Unknown example:', example);
      break;
  }
};

const example = document.getElementById('example');

const handleExample = event => createPiles(event.target.value);

example.addEventListener('change', handleExample);

createPiles(example.value);
