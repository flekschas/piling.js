import * as PIXI from 'pixi.js';

const renderStroke = strokes => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'white';
  strokes.forEach(stroke => {
    const xPos = stroke[0];
    const yPos = stroke[1];
    const finalPos = xPos.map((x, i) => [x, yPos[i]]);
    ctx.beginPath();
    ctx.moveTo(...finalPos[0]);
    finalPos.forEach(pos => {
      ctx.lineTo(...pos);
    });
    ctx.closePath();
    ctx.stroke();
  });
  return PIXI.Texture.from(canvas);
};

const createQuickDrawRenderer = () => sources =>
  Promise.all(sources.map(src => renderStroke(src)));

export default createQuickDrawRenderer;
