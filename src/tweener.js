import { cubicInOut } from './utils';

/**
 *
 * @param {number} duration - The time duration of animation
 * @param {number} delay - The delay of animation
 * @param {function} interpolator - The interpolator function
 * @param {function} easing - The easing function of animation
 * @param {object} endValue - The end value of animation
 * @param {function} getter - The function to get the current value
 * @param {function} setter - The function to set the new value
 * @param {function} onDone - The callback function when the animation is done
 */
const createTweener = ({
  duration = 300,
  delay = 0,
  interpolator,
  easing = cubicInOut,
  endValue,
  getter,
  setter,
  onDone = null
} = {}) => {
  let startValue;
  let startTime;
  let dt;
  let interpolate;

  const startAnimation = () => {
    startTime = performance.now();
    startValue = getter();
    interpolate = interpolator(startValue, endValue);
  };

  const register = () => {
    setTimeout(startAnimation, delay);
  };

  const update = () => {
    if (!startValue) return false;

    dt = performance.now() - startTime;

    if (dt >= duration) {
      if (onDone !== null) onDone(getter());
      return true;
    }

    setter(interpolate(easing(dt / duration)));

    return false;
  };

  const setEasing = newEasing => {
    // eslint-disable-next-line no-param-reassign
    easing = newEasing;
  };

  return {
    register,
    update,
    getDt: () => dt,
    setEasing
  };
};

export default createTweener;
