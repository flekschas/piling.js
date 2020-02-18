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
    // const start = performance.now();
    const done = [];
    tweeners.forEach(tweener => {
      if (tweener.update()) done.push(tweener);
    });
    // const dt = performance.now() - start;
    render();

    // Remove tweeners that are done updating
    done.forEach(tweener => {
      tweener.onDone();
      tweeners.delete(tweener);
    });
    // console.log(`One animation step took ${dt} msec`);
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
