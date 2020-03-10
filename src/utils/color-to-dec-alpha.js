const colorToDecAlpha = (color, defaultAlpha = 1) => {
  if (typeof color === 'string' || color instanceof String) {
    // HEX
    if (color[0] === '#') return [parseInt(color.substr(1), 16), defaultAlpha];

    // RGBA
    if (color.substring(0, 3) === 'rgb') {
      const matches = color.match(/(\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?/);
      return [
        matches
          .slice(1, 4)
          // eslint-disable-next-line no-bitwise
          .map((x, i) => +x << (8 * (2 - i)))
          .reduce((x, sum) => sum + x, 0),
        Number.isNaN(+matches[4]) ? 1 : +matches[4]
      ];
    }

    // RGB
    return [
      color
        .match(/(\d+),\s*(\d+),\s*(\d+)/)
        .slice(1)
        // eslint-disable-next-line no-bitwise
        .map((x, i) => +x << (8 * (2 - i)))
        .reduce((x, dec) => dec + x, 0),
      defaultAlpha
    ];
  }

  return [parseInt(color, 10), defaultAlpha];
};

export default colorToDecAlpha;
