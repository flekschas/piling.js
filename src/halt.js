import {
  assign,
  pipe,
  removeAllChildren,
  withConstructor,
  withReadOnlyProperty,
  withStaticProperty
} from '@flekschas/utils';

import createSpinner from './spinner';

import {
  CSS_EASING_CUBIC_IN_OUT,
  DEFAULT_DARK_MODE,
  DEFAULT_HALT_BACKGROUND_OPACITY
} from './defaults';

const createHalt = ({
  backgroundOpacity: initialBackgroundOpacity = DEFAULT_HALT_BACKGROUND_OPACITY,
  isDarkMode: initialIsDarkMode = DEFAULT_DARK_MODE
} = {}) => {
  let backgroundOpacity = initialBackgroundOpacity;
  let isDarkMode = initialIsDarkMode;

  const getTextColor = () => (isDarkMode ? 'black' : 'white');

  const getForegroundColor = () => (isDarkMode ? 'white' : 'black');

  const getBackgroundColor = () =>
    isDarkMode
      ? `rgba(0, 0, 0, ${backgroundOpacity})`
      : `rgba(255, 255, 255, ${backgroundOpacity})`;

  const rootElement = document.createElement('div');
  rootElement.style.position = 'absolute';
  rootElement.style.top = 0;
  rootElement.style.left = 0;
  rootElement.style.zIndex = -1;
  rootElement.style.display = 'flex';
  rootElement.style.flexDirection = 'column';
  rootElement.style.justifyContent = 'center';
  rootElement.style.width = '100%';
  rootElement.style.height = '0px';
  rootElement.style.background = getBackgroundColor();
  rootElement.style.opacity = 0;
  rootElement.style.transition = `opacity 250ms ${CSS_EASING_CUBIC_IN_OUT}`;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.display = 'flex';
  wrapper.style.margin = '2rem';
  wrapper.style.maxHeight = '100%';
  rootElement.appendChild(wrapper);

  const popup = document.createElement('div');
  popup.style.position = 'relative';
  popup.style.minwidth = '4rem';
  popup.style.maxWidth = '100%';
  popup.style.maxHeight = '100%';
  popup.style.margin = '2rem auto';
  popup.style.color = getTextColor();
  popup.style.borderRadius = '0.5rem';
  popup.style.background = getForegroundColor();
  popup.style.transform = 'scale(0)';
  popup.style.transition = `transform 250ms ${CSS_EASING_CUBIC_IN_OUT}`;
  wrapper.appendChild(popup);

  const popupContent = document.createElement('div');
  popupContent.style.position = 'relative';
  popupContent.style.display = 'flex';
  popupContent.style.flexDirection = 'column';
  popupContent.style.alignItems = 'center';
  popupContent.style.padding = '1rem';
  popupContent.style.maxHeight = 'calc(100vh - 4rem)';
  popupContent.style.overflow = 'auto';
  popup.appendChild(popupContent);

  const icon = document.createElement('div');
  popupContent.appendChild(icon);

  icon.appendChild(createSpinner());

  const paragraph = document.createElement('p');
  paragraph.style.margin = '0';
  popupContent.appendChild(paragraph);

  let isOpen = false;

  const open = ({ text = null, spinner = true } = {}) => {
    isOpen = true;
    rootElement.style.zIndex = 99;
    rootElement.style.height = '100%';
    rootElement.style.opacity = 1;

    popup.style.transform = 'scale(1)';

    icon.style.display = spinner ? 'block' : 'none';
    icon.style.margin = text ? '0 0 0.5rem 0' : '0';

    paragraph.textContent = text;
  };

  const animationEndHandler = () => {
    rootElement.style.zIndex = -1;
    rootElement.style.height = '0px';
    removeAllChildren(icon);
    paragraph.textContent = null;
  };

  const close = () => {
    isOpen = false;
    rootElement.addEventListener('transitionend', animationEndHandler, {
      once: true
    });
    rootElement.style.opacity = 0;
    popup.style.transform = 'scale(0)';
  };

  const ifNotNull = (v, alternative) => (v === null ? alternative : v);

  const set = ({
    backgroundOpacity: newBackgroundOpacity = null,
    darkMode: newIsDarkMode = null
  } = {}) => {
    backgroundOpacity = ifNotNull(newBackgroundOpacity, backgroundOpacity);
    isDarkMode = ifNotNull(newIsDarkMode, isDarkMode);

    popup.style.color = getTextColor();
    popup.style.background = getForegroundColor();
    rootElement.style.background = getBackgroundColor();
  };

  const withPublicMethods = () => self =>
    assign(self, {
      close,
      open,
      set
    });

  return pipe(
    withReadOnlyProperty('isOpen', () => isOpen),
    withStaticProperty('element', rootElement),
    withPublicMethods(),
    withConstructor(createHalt)
  )({});
};

export default createHalt;
