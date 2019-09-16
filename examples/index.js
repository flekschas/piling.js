import createPileMe from '../src/index';
import imageRenderer from '../src/image-renderer';
import dataJson from './data/data.json';

const pileMe = createPileMe(document.getElementById('demo'));

pileMe.set('renderer', imageRenderer);
const item = [];
// for (let i = 0; i < 100; i++)
item.push(...dataJson);

pileMe.set('items', item);
// pileMe.set('items', [
//   {
//     id: 'test',
//     src: 'data/cat_0000.jpg'
//   },
//   {
//     id: 'test2',
//     src: 'data/cat_0001.jpg'
//   },
//   {
//     id: 'test3',
//     src: 'data/cat_0002.jpg'
//   },
//   {
//     id: 'test4',
//     src: 'data/cat_0003.jpg'
//   },
//   {
//     id: 'test5',
//     src: 'data/cat_0004.jpg'
//   },
//   {
//     id: 'test6',
//     src: 'data/cat_0005.jpg'
//   },
//   {
//     id: 'test7',
//     src: 'data/cat_0006.jpg'
//   },
//   {
//     id: 'test8',
//     src: 'data/cat_0007.jpg'
//   },
//   {
//     id: 'test9',
//     src: 'data/cat_0008.jpg'
//   },
//   {
//     id: 'test10',
//     src: 'data/cat_0009.jpg'
//   },
//   {
//     id: 'test11',
//     src: 'data/cat_0010.jpg'
//   },
//   {
//     id: 'test12',
//     src: 'data/cat_0011.jpg',
//     position: [3, 4]
//   },
//   {
//     id: 'test13',
//     src: 'data/cat_0012.jpg',
//     position: [5, 6]
//   },
//   {
//     id: 'test14',
//     src: 'data/cat_0013.jpg',
//     position: [8, 3]
//   },
//   {
//     id: 'test15',
//     src: 'data/cat_0014.jpg',
//     position: [7, 7]
//   },
//   {
//     id: 'test16',
//     src: 'data/cat_0015.jpg',
//     position: [1, 8]
//   },
//   {
//     id: 'test17',
//     src: 'data/cat_0016.jpg',
//     position: [9, 8]
//   },
//   {
//     id: 'test18',
//     src: 'data/cat_0017.jpg',
//     position: [2, 5]
//   },
//   {
//     id: 'test19',
//     src: 'data/cat_0018.jpg',
//     position: [4, 3]
//   },
//   {
//     id: 'test20',
//     src: 'data/cat_0019.jpg',
//     position: [3, 11]
//   },
//   {
//     id: 'test21',
//     src: 'data/cat_0020.jpg',
//     position: [8, 9]
//   }
// ]);
pileMe.set('grid', [10]);
// pileMe.set('itemAlignment', false);
// pileMe.set('itemSizeRange', [0.8, 0.9]);
// pileMe.set('itemRotated', true);
// pileMe.set('tempDepileDirection', 'vertical');
// pileMe.set('tempDepileOneDNum', 10);
// pileMe.set('depileMethod', 'cloestPos');
