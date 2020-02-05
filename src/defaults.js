// prettier-ignore
export const CAMERA_VIEW = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
]);

export const INITIAL_ARRANGEMENT_TYPE = 'index';
export const INITIAL_ARRANGEMENT_OBJECTIVE = (pileState, i) => i;

export const NAVIGATION_MODE_AUTO = 'auto';
export const NAVIGATION_MODE_PAN_ZOOM = 'panZoom';
export const NAVIGATION_MODE_SCROLL = 'scroll';
export const NAVIGATION_MODES = [
  NAVIGATION_MODE_AUTO,
  NAVIGATION_MODE_PAN_ZOOM,
  NAVIGATION_MODE_SCROLL
];

export const POSITION_PILES_DEBOUNCE_TIME = 100;
