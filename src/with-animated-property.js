import {
  assign,
  capitalize,
  interpolateNumber,
  pipe,
  withProperty,
} from '@flekschas/utils';

import createTweener from './tweener';

const addAnimation = (
  { name, pubSub },
  { duration, delay, eps = 1e-6 } = {}
) => (self) => {
  const getter = () => self[name];
  const setter = (value) => {
    self[`set${capitalize(name)}`](value);
  };

  let tweener;

  return assign(self, {
    [`animate${capitalize(name)}`]: (newValue) => {
      const d = Math.abs(newValue - getter());

      if (d < eps) {
        setter(newValue);
        return;
      }

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
        endValue: newValue,
        getter,
        setter,
      });
      pubSub.publish('startAnimation', tweener);
    },
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
    delay,
  } = {}
) => (self) =>
  pipe(
    withProperty(name, {
      initialValue,
      getter,
      setter,
      cloner,
      transformer,
      validator,
    }),
    addAnimation({ name, pubSub }, { duration, delay })
  )(self);

export default withAnimatedProperty;
