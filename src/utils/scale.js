const createScale = (transformer = (x) => x) => {
  let domainMin = 1;
  let domainMinTransformed = Math.log10(domainMin);
  let domainMax = 10;
  let domainMaxTransformed = Math.log10(domainMax);
  let domainSize = domainMaxTransformed - domainMinTransformed;

  let rangeMin = 0;
  let rangeMax = 1;
  let rangeSize = 1;

  const scale = (value) =>
    Math.min(
      rangeMax,
      Math.max(
        rangeMin,
        rangeMax -
          ((domainMaxTransformed - transformer(value)) / domainSize) * rangeSize
      )
    );

  scale.domain = (newDomain = []) => {
    if (newDomain.length === 0) return [domainMin, domainMax];

    const [newDomainMin, newDomainMax] = newDomain;

    domainMin = newDomainMin;
    domainMinTransformed = transformer(newDomainMin);
    domainMax = newDomainMax;
    domainMaxTransformed = transformer(newDomainMax);

    domainSize = domainMaxTransformed - domainMinTransformed || 1;

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

export default createScale;
