import * as PIXI from 'pixi.js';

const renderStroke = (ctx, strokes, size) => {
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();

  for (let s = 0; s < strokes.length; s++) {
    const xPos = strokes[s][0];
    const yPos = strokes[s][1];
    ctx.moveTo((xPos[0] / 256) * size, (yPos[0] / 256) * size);
    for (let i = 0; i < xPos.length; i++) {
      ctx.lineTo((xPos[i] / 256) * size, (yPos[i] / 256) * size);
    }
    ctx.stroke();
  }

  // Needed for Safari
  return new Uint8Array(ctx.getImageData(0, 0, size, size).data.buffer);
};

const createGoogleQuickDrawRenderer = (size = 64) => sources => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  return Promise.resolve(
    sources.map(src =>
      PIXI.Texture.fromBuffer(renderStroke(ctx, src, size), size, size)
    )
  );
};

export default createGoogleQuickDrawRenderer;
