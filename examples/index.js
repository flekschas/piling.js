import createPileMe from '../src/index';
import imageRenderer from '../src/image-renderer';

const pileMe = createPileMe(document.getElementById('demo'));

pileMe.set('renderer', imageRenderer);
pileMe.set('items', [
  {
    id: 'test',
    src:
      'http://pbs.twimg.com/profile_images/851447292120805376/y_RzZDR__normal.jpg'
  },
  {
    id: 'test2',
    src: 'https://ask-me-or-tell-me.s3.us-east-2.amazonaws.com/assaaa.png'
  }
]);
