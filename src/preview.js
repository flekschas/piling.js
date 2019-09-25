import * as PIXI from 'pixi.js';

const createPreview = (previewTexture, spacing) => {
  const previewContainer = new PIXI.Container();

  const previewBg = new PIXI.Graphics();

  const previewSprite = new PIXI.Sprite(previewTexture);
  previewSprite.y = spacing / 2;
  previewSprite.x = spacing / 2;

  const drawBg = color => {
    previewBg.clear();
    previewBg.beginFill(color);
    previewBg.drawRect(
      0,
      0,
      previewSprite.width + spacing,
      previewSprite.height + spacing
    );
    previewBg.endFill();
  };

  previewContainer.addChild(previewBg);
  previewContainer.addChild(previewSprite);

  previewContainer.interactive = true;
  previewContainer.buttonMode = true;

  drawBg(0x00000);

  return {
    previewContainer,
    previewSprite,
    drawBg
  };
};

export default createPreview;
