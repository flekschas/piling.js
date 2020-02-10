// prettier-ignore
export const CAMERA_VIEW = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
]);

export const DEFAULT_PILE_ITEM_BRIGHTNESS = 0;
export const DEFAULT_PILE_ITEM_TINT = 0xffffff;

export const EVENT_LISTENER_ACTIVE = { passive: false };
export const EVENT_LISTENER_PASSIVE = { passive: true };

export const INITIAL_ARRANGEMENT_TYPE = 'index';
export const INITIAL_ARRANGEMENT_OBJECTIVE = (pileState, i) => i;

export const LASSO_MIN_DIST = 2;
export const LASSO_MIN_DELAY = 10;

export const NAVIGATION_MODE_AUTO = 'auto';
export const NAVIGATION_MODE_PAN_ZOOM = 'panZoom';
export const NAVIGATION_MODE_SCROLL = 'scroll';
export const NAVIGATION_MODES = [
  NAVIGATION_MODE_AUTO,
  NAVIGATION_MODE_PAN_ZOOM,
  NAVIGATION_MODE_SCROLL
];

export const POSITION_PILES_DEBOUNCE_TIME = 100;
