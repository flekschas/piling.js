import styleToCss from 'style-object-to-css-string';

const STYLES_ROOT = {
  position: 'absolute',
  zIndex: 2,
  display: 'none',
  backgroundColor: '#fff'
};

const STYLES_UL = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  borderRadius: '0.25rem',
  boxShadow:
    '0 0 0 1px rgba(0, 0, 0, 0.25), 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 2px 6px 0 rgba(0, 0, 0, 0.075)'
};

const STYLES_BUTTON = {
  width: '100%',
  height: '1.5rem',
  margin: 0,
  padding: '0.25rem 0.5rem',
  fontSize: '0.85rem',
  color: 'black',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  outline: 'none'
};

const STYLES_FIRST_BUTTON = {
  borderRadius: '0.25rem 0.25rem 0 0'
};

const STYLES_LAST_BUTTON = {
  borderRadius: '0 0 0.25rem 0.25rem'
};

const STYLES_BUTTON_HOVER = {
  backgroundColor: '#ff7ff6'
};

const STYLES_BUTTON_ACTIVE = {
  backgroundColor: '#dd33ff'
};

const STYLES = {
  root: STYLES_ROOT,
  ul: STYLES_UL,
  button: STYLES_BUTTON,
  'button:hover': STYLES_BUTTON_HOVER,
  'button:active': STYLES_BUTTON_ACTIVE,
  'li:first-child > button': STYLES_FIRST_BUTTON,
  'li:last-child > button': STYLES_LAST_BUTTON
};

const TEMPLATE = `<ul>
  <li>
    <button id="depile-button">depile</button>
  </li>
  <li>
    <button id="temp-depile-button">temp depile</button>
  </li>
  <li>
    <button id="grid-button">show grid</button>
  </li>
  <li>
    <button id="align-button">align by grid</button>
  </li>
  <li>
    <button id="scale-button">scale up</button>
  </li>
</ul>`;

const createContextMenu = (template = TEMPLATE, styles = STYLES) => {
  const rootElement = document.createElement('nav');
  rootElement.id = 'piling-js-context-menu';

  // Create CSS
  const css = document.createElement('style');
  css.setAttribute('type', 'text/css');

  let cssString = '';
  Object.entries(styles).forEach(([key, value]) => {
    const identifier = key === 'root' ? '' : ` ${key}`;
    cssString += `#piling-js-context-menu${identifier} { ${styleToCss(
      value
    )} }\n`;
  });
  css.textContent = cssString;

  rootElement.appendChild(css);

  // Add menu
  rootElement.insertAdjacentHTML('beforeend', template);

  return rootElement;
};

export default createContextMenu;
