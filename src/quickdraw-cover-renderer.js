import * as PIXI from 'pixi.js';

const renderCanvas = (imageData, size = 64) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.putImageData(imageData, 0, 0);

  return PIXI.Texture.from(canvas);
};

const createQuickDrawCoverRenderer = size => sources =>
  Promise.all(sources.map(src => renderCanvas(src, size)));

export default createQuickDrawCoverRenderer;
