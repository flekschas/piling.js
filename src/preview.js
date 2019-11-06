import * as PIXI from 'pixi.js';

export const MODE_HOVER = 'hover';

const createPreview = ({ texture, store }) => {
  const previewContainer = new PIXI.Container();

  const previewBg = new PIXI.Graphics();

  const previewSprite = new PIXI.Sprite(texture);
  previewSprite.y = store.getState().previewSpacing / 2;
  previewSprite.x = store.getState().previewSpacing / 2;

  const drawBg = (mode = '', color = null, opacity = null) => {
    if (mode === 'hover') {
      // eslint-disable-next-line no-param-reassign
      color = color || store.getState().previewBackgroundColor;
      // eslint-disable-next-line no-param-reassign
      opacity = color || store.getState().previewBackgroundOpacity;
    } else if (mode === '') {
      // eslint-disable-next-line no-param-reassign
      color = color || store.getState().pileBackgroundColor;
      // eslint-disable-next-line no-param-reassign
      opacity = color || store.getState().pileBackgroundOpacity;
    }

    previewBg.clear();
    previewBg.beginFill(color, opacity);
    previewBg.drawRect(
      0,
      0,
      previewSprite.width + store.getState().previewSpacing,
      previewSprite.height + store.getState().previewSpacing
    );
    previewBg.endFill();
  };

  previewContainer.addChild(previewBg);
  previewContainer.addChild(previewSprite);

  previewContainer.interactive = true;
  previewContainer.buttonMode = true;

  drawBg();

  return {
    previewContainer,
    previewSprite,
    drawBg
  };
};

export default createPreview;
