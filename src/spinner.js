import {
  createHtmlByTemplate,
  pipe,
  withConstructor,
  withStaticProperty,
} from '@flekschas/utils';

import { ifNotNull } from './utils';

const createSpinnerElement = () =>
  createHtmlByTemplate(`<svg class="pilingjs-spinner" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
  <circle
    class="pilingjs-spinner-circle"
    cx="20"
    cy="20"
    r="18"
    stroke-width="4"
    fill="none"
    stroke="black" />
  <g class="pilingjs-spinner-block-offset" transform="translate(20, 20)">
    <g class="pilingjs-spinner-blocks">
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        dur="1.5s"
        from="0"
        repeatCount="indefinite"
        to="360"z
        type="rotate" />
      <path
        class="pilingjs-spinner-block-one"
        d="M0-20c1.104,0,2,0.896,2,2s-0.896,2-2,2V0l-4,21h25v-42H0V-20z"
        fill="white">
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          calcMode="spline"
          dur="1.5s"
          from="0"
          values="0; 360"
          keyTimes="0; 1"
          keySplines="0.2 0.2 0.15 1"
          repeatCount="indefinite"
          to="360"
          type="rotate" />
      </path>
      <path
        class="pilingjs-spinner-block-two"
        d="M0-20c-1.104,0-2,0.896-2,2s0.896,2,2,2V0l4,21h-25v-42H0V-20z"
        fill="white">
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          calcMode="spline"
          dur="1.5s"
          from="0"
          values="0; 360"
          keyTimes="0; 1"
          keySplines="0.1 0.15 0.8 0.8"
          repeatCount="indefinite"
          to="360"
          type="rotate" />
      </path>
    </g>
  </g>
</svg>
`);

const createSpinner = (darkMode = false) => {
  const element = createSpinnerElement();

  const updateColors = () => {
    const fg = darkMode ? 'white' : 'black';
    const bg = darkMode ? 'black' : 'white';
    element
      .querySelector('.pilingjs-spinner-circle')
      .setAttribute('stroke', fg);
    element
      .querySelector('.pilingjs-spinner-block-one')
      .setAttribute('fill', bg);
    element
      .querySelector('.pilingjs-spinner-block-two')
      .setAttribute('fill', bg);
  };

  const set = ({ darkMode: newDarkMode = null }) => {
    // eslint-disable-next-line no-param-reassign
    darkMode = ifNotNull(newDarkMode, darkMode);

    updateColors();
  };

  updateColors();

  return pipe(
    withStaticProperty('element', element),
    withConstructor(createSpinner)
  )({
    set,
  });
};

export default createSpinner;
