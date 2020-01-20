import createTweener from './tweener';
import withProperty from './with-property';

import { assign, capitalize, interpolateNumber, pipe } from './utils';

const addAnimation = ({ name, pubSub }, { duration } = {}) => self => {
  const getter = () => self[name];
  const setter = () => self[`set${capitalize(name)}`];

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
  { cloner, transformer, validator, duration } = {}
) => self =>
  pipe(
    withProperty(name, { cloner, transformer, validator }),
    addAnimation({ name, pubSub }, { duration })
  )(self);

export default withAnimatedProperty;
