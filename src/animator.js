import withRaf from 'with-raf';
import { throttleAndDebounce } from '@flekschas/utils';

const PARTIAL_ON_DONE_BATCH_SIZE = 100;

/**
 * Factory function to create an animator
 * @param {function} render - Render funtion
 * @param {function} pubSub - PubSub messenger
 */
const createAnimator = (render, pubSub) => {
  const activeTweeners = new Set();
  let doneTweeners = [];
  let isAnimating = false;

  const onCall = () => {
    if (activeTweeners.size) {
      animateRaf();
    } else {
      onDone();
      if (isAnimating) pubSub.publish('animationEnd');
      isAnimating = false;
    }
  };

  const onDone = () => {
    doneTweeners.forEach((tweener) => tweener.onDone());
    doneTweeners = [];
  };

  const onDonePartial = () => {
    const tobeInvoked = doneTweeners.slice(0, PARTIAL_ON_DONE_BATCH_SIZE);
    doneTweeners.splice(0, PARTIAL_ON_DONE_BATCH_SIZE);

    tobeInvoked.forEach((tweener) => tweener.onDone());
  };

  const onDonePartialDb = throttleAndDebounce(onDonePartial, 50);

  const animate = () => {
    isAnimating = true;
    activeTweeners.forEach((tweener) => {
      if (tweener.update()) doneTweeners.push(tweener);
    });
    render();

    // Remove tweeners that are done updating
    doneTweeners.forEach((tweener) => activeTweeners.delete(tweener));

    // Partially invoke onDone();
    onDonePartialDb();
  };

  const animateRaf = withRaf(animate, onCall);

  const add = (tweener) => {
    activeTweeners.add(tweener);
    tweener.register();
    animateRaf();
  };

  const addBatch = (tweeners) => {
    tweeners.forEach((tweener) => {
      activeTweeners.add(tweener);
      tweener.register();
    });
    animateRaf();
  };

  const cancel = (tweener) => {
    activeTweeners.delete(tweener);
  };

  return {
    add,
    addBatch,
    cancel,
  };
};

export default createAnimator;
