/* eslint-env worker */
/* eslint no-restricted-globals: 1 */

const worker = function worker() {
  let canvas;
  let ctx;

  const renderStroke = (strokes, size = 64) => {
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

    return ctx.getImageData(0, 0, size, size);
  };

  self.onmessage = function onmessage(e) {
    if (e.data.canvas) {
      canvas = e.data.canvas;
      ctx = canvas.getContext('2d');
      return;
    }

    try {
      const pixels = renderStroke(e.data.src, e.data.size);
      self.postMessage({ pixels: pixels.data }, [pixels.data.buffer]);
    } catch (error) {
      self.postMessage({ error });
    }
  };
};

export default worker;
