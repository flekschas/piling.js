import createPileMe from '../src/index';
import imageRenderer from '../src/image-renderer';

const pileMe = createPileMe(document.getElementById('demo'));

pileMe.set('renderer', imageRenderer);
pileMe.set('items', [
  {
    id: 'test',
    src: 'data/cat_0000.jpg'
  },
  {
    id: 'test2',
    src: 'data/cat_0001.jpg'
  },
  {
    id: 'test3',
    src: 'data/cat_0002.jpg'
  },
  {
    id: 'test4',
    src: 'data/cat_0003.jpg'
  },
  {
    id: 'test5',
    src: 'data/cat_0004.jpg'
  },
  {
    id: 'test6',
    src: 'data/cat_0005.jpg'
  },
  {
    id: 'test7',
    src: 'data/cat_0006.jpg'
  },
  {
    id: 'test8',
    src: 'data/cat_0007.jpg'
  },
  {
    id: 'test9',
    src: 'data/cat_0008.jpg'
  },
  {
    id: 'test10',
    src: 'data/cat_0009.jpg'
  },
  {
    id: 'test11',
    src: 'data/cat_0010.jpg'
  }
]);
pileMe.set('grid', [10, 10]);
