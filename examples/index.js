import createPhotoPiles from './photos';
import createMatrixPiles from './matrices';

const examplePhotosEl = document.getElementById('photos');
const exampleMatricesEl = document.getElementById('matrices');

let pileJs;

const createPiles = example => {
  switch (example) {
    case 'photos':
      if (pileJs) pileJs.destroy();
      exampleMatricesEl.style.display = 'none';
      examplePhotosEl.style.display = 'block';
      pileJs = createPhotoPiles(examplePhotosEl);
      break;

    case 'matrices':
      if (pileJs) pileJs.destroy();
      examplePhotosEl.style.display = 'none';
      exampleMatricesEl.style.display = 'block';
      pileJs = createMatrixPiles(exampleMatricesEl);
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
