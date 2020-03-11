const scaleLinear = () => {
  let domainMin = 0;
  let domainMax = 1;
  let domainSize = 1;

  let rangeMin = 0;
  let rangeMax = 1;
  let rangeSize = 1;

  const scale = value =>
    Math.min(
      rangeMax,
      Math.max(
        rangeMin,
        rangeMax - ((domainMax - value) / domainSize) * rangeSize
      )
    );

  scale.domain = (newDomain = []) => {
    if (newDomain.length === 0) return [domainMin, domainMax];

    const [newDomainMin, newDomainMax] = newDomain;

    domainMin = newDomainMin;
    domainMax = newDomainMax;

    domainSize = domainMax - domainMin || 1;

    return scale;
  };

  scale.range = (newRange = []) => {
    if (newRange.length === 0) return [rangeMin, rangeMax];

    const [newRangeMin, newRangeMax] = newRange;

    rangeMin = newRangeMin;
    rangeMax = newRangeMax;

    rangeSize = rangeMax - rangeMin;

    return scale;
  };

  return scale;
};

export default scaleLinear;
