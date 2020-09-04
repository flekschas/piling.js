import createBadge from './badge';
import createRoundedRectangleFactory from './rounded-rectangle-factory';

const createBadgeFactory = ({ fontSize = 8 } = {}) => {
  const sizeTexCache = new Map();
  let sizeUsage = {};

  const roundedRectangleFactory = createRoundedRectangleFactory({
    size: fontSize * window.devicePixelRatio * 1.5,
  });

  const onDestroy = (text) => () => {
    sizeUsage[text] = Math.max(0, sizeUsage[text] - 1);
    if (sizeUsage[text] === 0) {
      sizeTexCache.get(text).image.destroy();
      sizeTexCache.delete(text);
      delete sizeUsage[text];
    }
  };

  const create = (text, { darkMode } = {}) => {
    if (sizeTexCache.has(text)) {
      ++sizeUsage[text];
      return sizeTexCache.get(text).clone();
    }

    const badge = createBadge(text, {
      backgroundFactory: roundedRectangleFactory,
      darkMode,
      fontSize,
      onDestroy: onDestroy(text),
    });

    sizeUsage[text] = 1;
    sizeTexCache.set(text, badge);

    return badge;
  };

  const clear = () => {
    sizeTexCache.forEach((badge) => badge.destroy());
    sizeTexCache.clear();
    sizeUsage = {};
  };

  return {
    clear,
    create,
    destroy: clear,
  };
};

export default createBadgeFactory;
