import withRaf from 'with-raf';

/**
 * Factory function to create an animator
 * @param {function} render - Render funtion
 * @param {function} pubSub - PubSub messenger
 */
const createAnimator = (render, pubSub) => {
  const currentTweeners = new Set();
  let isAnimating = false;

  const onCall = () => {
    if (currentTweeners.size) {
      // eslint-disable-next-line no-use-before-define
      animateRaf();
    } else {
      if (isAnimating) pubSub.publish('animationEnd');
      isAnimating = false;
    }
  };

  const animate = () => {
    isAnimating = true;
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
