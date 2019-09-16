import createPileMe from '../src/index';
import imageRenderer from '../src/image-renderer';
import dataJson from './data/data.json';

const pileMe = createPileMe(document.getElementById('demo'));

pileMe.set('renderer', imageRenderer);
const item = [];
// for (let i = 0; i < 100; i++)
item.push(...dataJson);

pileMe.set('items', item);
pileMe.set('grid', [10]);
// pileMe.set('itemAlignment', false);
// pileMe.set('itemSizeRange', [0.8, 0.9]);
// pileMe.set('itemRotated', true);
// pileMe.set('tempDepileDirection', 'vertical');
// pileMe.set('tempDepileOneDNum', 10);
// pileMe.set('depileMethod', 'cloestPos');
