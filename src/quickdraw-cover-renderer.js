import * as PIXI from 'pixi.js';

const createQuickDrawCoverRenderer = ({ size = 64 } = {}) => sources =>
  Promise.all(sources.map(src => PIXI.Texture.fromBuffer(src, size, size)));

export default createQuickDrawCoverRenderer;
