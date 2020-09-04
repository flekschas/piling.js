import {
  assign,
  nextAnimationFrame,
  pipe,
  withConstructor,
  withReadOnlyProperty,
  withStaticProperty,
} from '@flekschas/utils';

import createSpinner from './spinner';

import { ifNotNull, whichTransitionEvent } from './utils';

import {
  CSS_EASING_CUBIC_IN_OUT,
  DEFAULT_DARK_MODE,
  DEFAULT_POPUP_BACKGROUND_OPACITY,
} from './defaults';

const TRANSITION_EVENT = whichTransitionEvent();

const createPopup = ({
  backgroundOpacity: initialBackgroundOpacity = DEFAULT_POPUP_BACKGROUND_OPACITY,
  isDarkMode: initialIsDarkMode = DEFAULT_DARK_MODE,
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
  rootElement.className = 'pilingjs-popup-background';
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
  rootElement.className = 'pilingjs-popup-wrapper';
  wrapper.style.position = 'relative';
  wrapper.style.display = 'flex';
  wrapper.style.margin = '2rem';
  wrapper.style.maxHeight = '100%';
  rootElement.appendChild(wrapper);

  const popup = document.createElement('div');
  rootElement.className = 'pilingjs-popup-window';
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
  rootElement.className = 'pilingjs-popup-content';
  popupContent.style.position = 'relative';
  popupContent.style.display = 'flex';
  popupContent.style.flexDirection = 'column';
  popupContent.style.alignItems = 'center';
  popupContent.style.padding = '1rem';
  popupContent.style.maxHeight = 'calc(100vh - 4rem)';
  popupContent.style.overflow = 'auto';
  popup.appendChild(popupContent);

  const icon = document.createElement('div');
  rootElement.className = 'pilingjs-popup-icon';
  popupContent.appendChild(icon);

  const spinner = createSpinner(!isDarkMode);
  icon.appendChild(spinner.element);

  const paragraph = document.createElement('p');
  paragraph.style.margin = '0';
  popupContent.appendChild(paragraph);

  let isOpen = false;

  const open = ({ text = null, showSpinner = true } = {}) =>
    new Promise((resolve) => {
      rootElement.addEventListener(TRANSITION_EVENT, resolve, {
        once: true,
      });

      isOpen = true;
      rootElement.style.zIndex = 99;
      rootElement.style.height = '100%';
      rootElement.style.opacity = 1;

      popup.style.transform = 'scale(1)';

      icon.style.display = showSpinner ? 'block' : 'none';
      icon.style.margin = text ? '0 0 0.5rem 0' : '0';

      paragraph.textContent = text;
    });

  const close = () =>
    new Promise((resolve) => {
      isOpen = false;
      rootElement.addEventListener(
        TRANSITION_EVENT,
        async () => {
          rootElement.style.zIndex = -1;
          rootElement.style.height = '0px';
          paragraph.textContent = null;

          await nextAnimationFrame();

          resolve();
        },
        {
          once: true,
        }
      );

      rootElement.style.opacity = 0;
      popup.style.transform = 'scale(0)';
    });

  const set = ({
    backgroundOpacity: newBackgroundOpacity = null,
    darkMode: newIsDarkMode = null,
  } = {}) => {
    backgroundOpacity = ifNotNull(newBackgroundOpacity, backgroundOpacity);
    isDarkMode = ifNotNull(newIsDarkMode, isDarkMode);

    popup.style.color = getTextColor();
    popup.style.background = getForegroundColor();
    rootElement.style.background = getBackgroundColor();
    spinner.set({ darkMode: !isDarkMode });
  };

  const withPublicMethods = () => (self) =>
    assign(self, {
      close,
      open,
      set,
    });

  return pipe(
    withReadOnlyProperty('isOpen', () => isOpen),
    withStaticProperty('element', rootElement),
    withPublicMethods(),
    withConstructor(createPopup)
  )({});
};

export default createPopup;
