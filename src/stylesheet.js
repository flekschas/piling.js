const createStylesheet = () => {
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);

  const stylesheets = styleEl.sheet;

  const addRule = (rule) => {
    const currentNumRules = stylesheets.length;
    stylesheets.insertRule(rule, currentNumRules);
    return currentNumRules;
  };

  const removeRule = (index) => {
    stylesheets.deleteRule(index);
  };

  const destroy = () => {
    document.head.removeChild(styleEl);
  };

  return {
    addRule,
    destroy,
    removeRule,
  };
};

export default createStylesheet;
