export const ALIGNMENTS_X = ['left', 'center', 'right'];
export const ALIGNMENTS_Y = ['top', 'center', 'bottom'];

export const EPS = 1e-9;

export const BLACK = 0x000000;
export const WHITE = 0xffffff;

// prettier-ignore
export const CAMERA_VIEW = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
]);

export const CSS_EASING_CUBIC_IN_OUT = 'cubic-bezier(0.645, 0.045, 0.355, 1)';

export const DEFAULT_DARK_MODE = false;

export const EVENT_LISTENER_ACTIVE = { passive: false };
export const EVENT_LISTENER_PASSIVE = { passive: true };

export const INHERIT = 'inherit';

export const INITIAL_ARRANGEMENT_TYPE = 'index';
export const INITIAL_ARRANGEMENT_OBJECTIVE = {
  property: (pileState, i) => i,
  isCustom: true,
};

export const DEFAULT_POPUP_BACKGROUND_OPACITY = 0.85;

export const DEFAULT_LASSO_FILL_OPACITY = 0.15;
export const DEFAULT_LASSO_SHOW_START_INDICATOR = true;
export const DEFAULT_LASSO_START_INDICATOR_OPACITY = 0.1;
export const DEFAULT_LASSO_STROKE_OPACITY = 0.8;
export const DEFAULT_LASSO_STROKE_SIZE = 1;
export const LASSO_MIN_DIST = 2;
export const LASSO_MIN_DELAY = 10;
export const LASSO_SHOW_START_INDICATOR_TIME = 2500;
export const LASSO_HIDE_START_INDICATOR_TIME = 250;

export const NAVIGATION_MODE_AUTO = 'auto';
export const NAVIGATION_MODE_PAN_ZOOM = 'panZoom';
export const NAVIGATION_MODE_SCROLL = 'scroll';
export const NAVIGATION_MODES = [
  NAVIGATION_MODE_AUTO,
  NAVIGATION_MODE_PAN_ZOOM,
  NAVIGATION_MODE_SCROLL,
];

export const DEFAULT_PILE_COVER_SCALE = 1.0;
export const DEFAULT_PILE_ITEM_BRIGHTNESS = 0;
export const DEFAULT_PILE_ITEM_TINT = 0xffffff;
export const DEFAULT_PILE_SIZE_BADGE_ALIGN = ['top', 'right'];

export const DEFAULT_PREVIEW_BACKGROUND_COLOR = INHERIT;
export const DEFAULT_PREVIEW_BACKGROUND_OPACITY = INHERIT;

export const DEFAULT_COLOR_MAP = [
  '#E69F00', // orange
  '#56B4E9', // sky blue
  '#009E73', // bluish green
  '#F0E442', // yellow
  '#0072B2', // blue
  '#D55E00', // vermillion
  '#CC79A7', // reddish purple
];

export const UNKNOWN_LABEL = {
  color: '#808080',
};

export const POSITION_PILES_DEBOUNCE_TIME = 100;
