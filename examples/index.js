import createPileMe from '../src/index';
import imageRenderer from '../src/image-renderer';
import dataJson from './data/data.json';

const pileMe = createPileMe(document.getElementById('demo'));

pileMe.set('renderer', imageRenderer);

pileMe.set('items', dataJson);

if (window.location.search) {
  pileMe.set('grid', [15]);
  pileMe.set('itemAlignment', false);
} else pileMe.set('grid', [10]);

// pileMe.set('itemAlignment', ['right']);
// pileMe.set('itemSizeRange', [0.8, 0.9]);
// pileMe.set('itemRotated', true);
// pileMe.set('tempDepileDirection', 'vertical');
// pileMe.set('tempDepileOneDNum', 10);
// pileMe.set('depileMethod', 'cloestPos');
