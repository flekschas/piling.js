import styleToCss from 'style-object-to-css-string';

const STYLES_ROOT = {
  position: 'absolute',
  zIndex: 2,
  display: 'none',
};

const STYLES_UL = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  borderRadius: '0.25rem',
  backgroundColor: 'white',
  boxShadow:
    '0 0 0 1px rgba(0, 0, 0, 0.25), 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 2px 6px 0 rgba(0, 0, 0, 0.075)',
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
  outline: 'none',
  whiteSpace: 'nowrap',
};

const STYLES_BUTTON_HOVER = {
  backgroundColor: '#ff7ff6',
};

const STYLES_BUTTON_ACTIVE = {
  backgroundColor: '#dd33ff',
};

const STYLES_BUTTON_INACTIVE = {
  cursor: 'default',
  opacity: 0.3,
  backgroundColor: 'transparent !important',
};

const STYLES_FIRST_BUTTON = {
  borderRadius: '0.25rem 0.25rem 0 0',
};

const STYLES_LAST_BUTTON = {
  borderRadius: '0 0 0.25rem 0.25rem',
};

const STYLES = {
  root: STYLES_ROOT,
  ul: STYLES_UL,
  button: STYLES_BUTTON,
  'button:hover': STYLES_BUTTON_HOVER,
  'button:active': STYLES_BUTTON_ACTIVE,
  'button.inactive': STYLES_BUTTON_INACTIVE,
  'li:first-child > button': STYLES_FIRST_BUTTON,
  'li:last-child > button': STYLES_LAST_BUTTON,
};

const TEMPLATE = `<ul id="piling-js-context-menu-list">
  <li>
    <button id="depile-button">Depile</button>
  </li>
  <li>
    <button id="temp-depile-button">Temp. Depile</button>
  </li>
  <li>
    <button id="browse-separately">Browse Separately</button>
  </li>
  <li>
    <button id="grid-button">Show Grid</button>
  </li>
  <li>
    <button id="align-button">Align by Grid</button>
  </li>
  <li>
    <button id="magnify-button">Magnify</button>
  </li>
</ul>`;

const createContextMenu = ({
  template = TEMPLATE,
  styles = STYLES,
  customItems = [],
} = {}) => {
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

  // Add custom items
  const ul = rootElement.querySelector('#piling-js-context-menu-list');
  customItems.forEach((item, index) => {
    const li = document.createElement('li');
    const button = document.createElement('button');

    button.textContent = item.label;

    if (item.id) button.id = item.id;
    else button.id = `piling-js-context-menu-custom-item-${index}`;

    li.appendChild(button);
    ul.appendChild(li);
  });

  return rootElement;
};

export default createContextMenu;
