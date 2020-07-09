const whichTransitionEvent = () => {
  const el = document.createElement('fake-element');
  const transitions = {
    WebkitTransition: 'webkitTransitionEnd',
    MozTransition: 'transitionend',
    MSTransition: 'msTransitionEnd',
    OTransition: 'oTransitionEnd',
    transition: 'transitionEnd',
  };

  // eslint-disable-next-line
  for (const t in transitions) {
    if (el.style[t] !== undefined) {
      return transitions[t];
    }
  }

  return 'transitionEnd';
};

export default whichTransitionEvent;
