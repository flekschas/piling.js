import { cubicInOut } from './utils';

const DEFAULT_DELAY = 0;
const DEFAULT_DURATION = 250;

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
  duration = DEFAULT_DURATION,
  delay = DEFAULT_DELAY,
  interpolator,
  easing = cubicInOut,
  endValue: initialEndValue,
  getter,
  setter,
  onDone = null
} = {}) => {
  let startValue;
  let startTime;
  let dt;
  let ready;
  let endValue = initialEndValue;

  const startAnimation = () => {
    startTime = performance.now();
    startValue = getter();
    ready = typeof startValue !== 'undefined' && startValue !== null;
    if (!ready) {
      console.warn(`Invalid start value for animation: ${startValue}`);
    }
  };

  const register = () => {
    setTimeout(startAnimation, delay);
  };

  /**
   * Set the value to the current progress given the elapsed time
   * @return  {bool}  If `true` the animation is over
   */
  const update = () => {
    if (!ready) return false;

    dt = performance.now() - startTime;

    if (dt >= duration) {
      // Ensure that the endValue is set
      setter(endValue);
      if (onDone !== null) onDone(getter());
      return true;
    }

    setter(interpolator(startValue, endValue, easing(dt / duration)));

    return false;
  };

  const setEasing = newEasing => {
    // eslint-disable-next-line no-param-reassign
    easing = newEasing;
  };

  const updateEndValue = newEndValue => {
    endValue = newEndValue;
  };

  return {
    get dt() {
      return dt;
    },
    get duration() {
      return duration;
    },
    register,
    update,
    updateEndValue,
    setEasing
  };
};

export default createTweener;
