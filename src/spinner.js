import { createHtmlByTemplate } from '@flekschas/utils';

const createSpinner = () =>
  createHtmlByTemplate(`<svg class="spinner" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
  <circle
    cx="20"
    cy="20"
    r="18"
    stroke-width="4"
    fill="none"
    stroke="#000" />
  <g class="correct" transform="translate(20, 20)">
    <g class="blocks">
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        dur="1.5s"
        from="0"
        repeatCount="indefinite"
        to="360"z
        type="rotate" />
      <path
        class="one"
        d="M0-20c1.104,0,2,0.896,2,2s-0.896,2-2,2V0l-4,21h25v-42H0V-20z"
        fill="#fff">
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
        class="two"
        d="M0-20c-1.104,0-2,0.896-2,2s0.896,2,2,2V0l4,21h-25v-42H0V-20z"
        fill="#fff">
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

export default createSpinner;
