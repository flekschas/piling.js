import createPilingJs, { createImageRenderer } from './piling';

const baseUrl = 'https://storage.googleapis.com/pilingjs/coco-cars';

export default function create(element) {
  return createPilingJs(element, {
    items: [
      { src: `${baseUrl}/000000209544.jpg` },
      { src: `${baseUrl}/000000218397.jpg` },
      { src: `${baseUrl}/000000342185.jpg` },
      { src: `${baseUrl}/000000383158.jpg` },
    ],
    itemRenderer: createImageRenderer(),
    columns: 4,
    darkMode: true,
  });
}
