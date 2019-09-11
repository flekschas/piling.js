import { cubicInOut } from './utils';

const createTweener = ({
  duration = 300,
  delay = 0,
  interpolator,
  easing = cubicInOut, // specify default
  endValue,
  getter,
  setter,
  onDone = null
} = {}) => {
  let startValue;
  let startTime;
  let Dt;
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

    Dt = performance.now() - startTime;

    if (Dt >= duration) {
      if (onDone !== null) onDone(getter());
      return true;
    }

    setter(interpolate(easing(Dt / duration)));

    return false;
  };

  const setEasing = newEasing => {
    // eslint-disable-next-line no-param-reassign
    easing = newEasing;
  };

  return {
    register,
    update,
    getDt: () => Dt,
    setEasing
  };
};

export default createTweener;
