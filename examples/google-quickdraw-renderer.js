import * as PIXI from 'pixi.js';

const renderStroke = (strokes, size = 64) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  for (let s = 0; s < strokes.length; s++) {
    const xPos = strokes[s][0];
    const yPos = strokes[s][1];
    ctx.moveTo((xPos[0] / 256) * size, (yPos[0] / 256) * size);
    for (let i = 0; i < xPos.length; i++) {
      ctx.lineTo((xPos[i] / 256) * size, (yPos[i] / 256) * size);
    }
    ctx.stroke();
  }

  return PIXI.Texture.from(canvas);
};

const createGoogleQuickDrawRenderer = size => sources =>
  Promise.all(sources.map(src => renderStroke(src, size)));

export default createGoogleQuickDrawRenderer;
