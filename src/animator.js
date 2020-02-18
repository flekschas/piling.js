import withRaf from 'with-raf';

/**
 * Factory function to create an animator
 * @param {function} render - Render funtion
 */
const createAnimator = render => {
  const currentTweeners = new Set();

  const onCall = () => {
    if (currentTweeners.size) {
      // eslint-disable-next-line no-use-before-define
      animateRaf();
    }
  };

  const animate = () => {
    const done = [];
    currentTweeners.forEach(tweener => {
      if (tweener.update()) done.push(tweener);
    });
    render();

    // Remove tweeners that are done updating
    done.forEach(tweener => {
      tweener.onDone();
      currentTweeners.delete(tweener);
    });
  };

  const animateRaf = withRaf(animate, onCall);

  const add = tweener => {
    currentTweeners.add(tweener);
    tweener.register();
    animateRaf();
  };

  const addBatch = tweeners => {
    tweeners.forEach(tweener => {
      currentTweeners.add(tweener);
      tweener.register();
    });
    animateRaf();
  };

  const cancel = tweener => {
    currentTweeners.delete(tweener);
  };

  return {
    add,
    addBatch,
    cancel
  };
};

export default createAnimator;
