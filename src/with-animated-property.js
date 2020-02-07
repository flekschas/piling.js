import {
  assign,
  capitalize,
  interpolateNumber,
  pipe,
  withProperty
} from '@flekschas/utils';

import createTweener from './tweener';

const addAnimation = ({ name, pubSub }, { duration, delay } = {}) => self => {
  const getter = () => self[name];
  const setter = value => {
    self[`set${capitalize(name)}`](value);
  };

  let tweener;

  return assign(self, {
    animateOpacity(newOpacity) {
      let remainingDuration = duration;
      if (tweener) {
        pubSub.publish('cancelAnimation', tweener);
        if (tweener.dt < tweener.duration) {
          remainingDuration = tweener.dt;
        }
      }
      tweener = createTweener({
        delay,
        duration: remainingDuration,
        interpolator: interpolateNumber,
        endValue: newOpacity,
        getter,
        setter
      });
      pubSub.publish('animate', tweener);
    }
  });
};

const withAnimatedProperty = (
  { name, pubSub },
  {
    initialValue,
    getter,
    setter,
    cloner,
    transformer,
    validator,
    duration,
    delay
  } = {}
) => self =>
  pipe(
    withProperty(name, {
      initialValue,
      getter,
      setter,
      cloner,
      transformer,
      validator
    }),
    addAnimation({ name, pubSub }, { duration, delay })
  )(self);

export default withAnimatedProperty;
