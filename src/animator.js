import withRaf from 'with-raf';

/**
 * Factory function to create an animator
 * @param {function} render - Render funtion
 */
const createAnimator = render => {
  const tweeners = new Set();

  const onCall = () => {
    if (tweeners.size) {
      // eslint-disable-next-line no-use-before-define
      animateRaf();
    }
  };

  const animate = () => {
    tweeners.forEach((tweener, index) => {
      if (tweener.update(index)) tweeners.delete(tweener);
    });
    render();
  };

  const animateRaf = withRaf(animate, onCall);

  const add = tweener => {
    tweeners.add(tweener);
    tweener.register();
    animateRaf();
  };

  const cancel = tweener => {
    tweeners.delete(tweener);
  };

  return {
    add,
    cancel
  };
};

export default createAnimator;
