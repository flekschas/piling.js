import {
  pipe,
  camelToConst,
  deepClone,
  cubicInOut,
  update,
  withForwardedMethod,
  withReadOnlyProperty,
  withStaticProperty,
} from '@flekschas/utils';
import deepEqual from 'deep-equal';
import { createStore as createReduxStore, combineReducers } from 'redux';
import { enableBatching } from 'redux-batched-actions';

import { version } from '../package.json';

import createOrderer from './orderer';

import {
  DEFAULT_DARK_MODE,
  DEFAULT_LASSO_FILL_OPACITY,
  DEFAULT_LASSO_SHOW_START_INDICATOR,
  DEFAULT_LASSO_START_INDICATOR_OPACITY,
  DEFAULT_LASSO_STROKE_OPACITY,
  DEFAULT_LASSO_STROKE_SIZE,
  DEFAULT_PILE_COVER_SCALE,
  DEFAULT_PILE_ITEM_BRIGHTNESS,
  DEFAULT_PILE_ITEM_TINT,
  DEFAULT_PILE_SIZE_BADGE_ALIGN,
  DEFAULT_POPUP_BACKGROUND_OPACITY,
  DEFAULT_PREVIEW_BACKGROUND_COLOR,
  DEFAULT_PREVIEW_BACKGROUND_OPACITY,
  NAVIGATION_MODE_AUTO,
  NAVIGATION_MODES,
} from './defaults';

const clone = (value, state) => {
  switch (typeof value) {
    case 'object': {
      if (!deepEqual(value, state)) {
        return deepClone(value);
      }

      return state;
    }
    default:
      return value;
  }
};

const setReducer = (key, defaultValue = null) => {
  const actionType = `SET_${camelToConst(key)}`;
  return (state = defaultValue, action) => {
    switch (action.type) {
      case actionType:
        return clone(action.payload[key], state);
      default:
        return state;
    }
  };
};

const setOptionsReducer = (key, options, defaultValue = null) => {
  // eslint-disable-next-line no-param-reassign
  options = new Set(options);

  const actionType = `SET_${camelToConst(key)}`;

  return (state = defaultValue, action) => {
    switch (action.type) {
      case actionType:
        if (options.has(action.payload[key])) {
          return clone(action.payload[key], state);
        }
        return state;

      default:
        return state;
    }
  };
};

const setAction = (key) => {
  const type = `SET_${camelToConst(key)}`;
  return (newValue) => ({ type, payload: { [key]: newValue } });
};

const setter = (key, defaultValue = null) => [
  setReducer(key, defaultValue),
  setAction(key),
];

const setterOptions = (key, options, defaultValue = null) => [
  setOptionsReducer(key, options, defaultValue),
  setAction(key),
];

export const reset = () => ({
  type: 'RESET',
  payload: {},
});

export const overwrite = (newState, debug) => ({
  type: 'OVERWRITE',
  payload: { newState, debug },
});

export const softOverwrite = (newState, debug) => ({
  type: 'SOFT_OVERWRITE',
  payload: { newState, debug },
});

const [arrangementType, setArrangementType] = setter('arrangementType');

const [arrangementObjective, setArrangementObjective] = setter(
  'arrangementObjective'
);

const [arrangeOnGrouping, setArrangeOnGrouping] = setter(
  'arrangeOnGrouping',
  false
);

const [arrangementOptions, setArrangementOptions] = setter(
  'arrangementOptions',
  {}
);

const [groupingType, setGroupingType] = setter('groupingType');

const [groupingObjective, setGroupingObjective] = setter('groupingObjective');

const [groupingOptions, setGroupingOptions] = setter('groupingOptions', {});

const [splittingType, setSplittingType] = setter('splittingType');

const [splittingObjective, setSplittingObjective] = setter(
  'splittingObjective'
);

const [splittingOptions, setSplittingOptions] = setter('splittingOptions', {});

const [backgroundColor, setBackgroundColor] = setter(
  'backgroundColor',
  0x000000
);

const [darkMode, setDarkMode] = setter('darkMode', DEFAULT_DARK_MODE);

const [dimensionalityReducer, setDimensionalityReducer] = setter(
  'dimensionalityReducer'
);

const [gridColor, setGridColor] = setter('gridColor', 0x787878);

const [gridOpacity, setGridOpacity] = setter('gridOpacity', 1);

const [showGrid, setShowGrid] = setter('showGrid', false);

const [popupBackgroundOpacity, setPopupBackgroundOpacity] = setter(
  'popupBackgroundOpacity',
  DEFAULT_POPUP_BACKGROUND_OPACITY
);

const [lassoFillColor, setLassoFillColor] = setter('lassoFillColor');

const [lassoFillOpacity, setLassoFillOpacity] = setter(
  'lassoFillOpacity',
  DEFAULT_LASSO_FILL_OPACITY
);

const [lassoShowStartIndicator, setLassoShowStartIndicator] = setter(
  'lassoShowStartIndicator',
  DEFAULT_LASSO_SHOW_START_INDICATOR
);

const [lassoStartIndicatorOpacity, setLassoStartIndicatorOpacity] = setter(
  'lassoStartIndicatorOpacity',
  DEFAULT_LASSO_START_INDICATOR_OPACITY
);

const [lassoStrokeColor, setLassoStrokeColor] = setter('lassoStrokeColor');

const [lassoStrokeOpacity, setLassoStrokeOpacity] = setter(
  'lassoStrokeOpacity',
  DEFAULT_LASSO_STROKE_OPACITY
);

const [lassoStrokeSize, setLassoStrokeSize] = setter(
  'lassoStrokeSize',
  DEFAULT_LASSO_STROKE_SIZE
);

const [itemRenderer, setItemRenderer] = setter('itemRenderer');

const [previewRenderer, setPreviewRenderer] = setter('previewRenderer');

const [coverRenderer, setCoverRenderer] = setter('coverRenderer');

const [previewAggregator, setPreviewAggregator] = setter('previewAggregator');

const [coverAggregator, setCoverAggregator] = setter('coverAggregator');

const [orderer, setOrderer] = setter('orderer', createOrderer().rowMajor);

// Grid
const [itemSize, setItemSize] = setter('itemSize');
const [itemSizeRange, setItemSizeRange] = setter('itemSizeRange', [0.5, 1.0]);
const [columns, setColumns] = setter('columns', 10);
const [rowHeight, setRowHeight] = setter('rowHeight');
const [cellAspectRatio, setCellAspectRatio] = setter('cellAspectRatio', 1);
const [cellPadding, setCellPadding] = setter('cellPadding', 12);
const [cellSize, setCellSize] = setter('cellSize');

const [pileCoverScale, setPileCoverScale] = setter(
  'pileCoverScale',
  DEFAULT_PILE_COVER_SCALE
);
const [pileCoverInvert, setPileCoverInvert] = setter('pileCoverInvert', false);
const [pileItemBrightness, setPileItemBrightness] = setter(
  'pileItemBrightness',
  DEFAULT_PILE_ITEM_BRIGHTNESS
);
const [pileItemInvert, setPileItemInvert] = setter('pileItemInvert', false);
const [pileItemOffset, setPileItemOffset] = setter('pileItemOffset', [5, 5]);
const [pileItemOpacity, setPileItemOpacity] = setter('pileItemOpacity', 1.0);
const [pileOrderItems, setPileOrderItems] = setter('pileOrderItems');
const [pileItemRotation, setPileItemRotation] = setter('pileItemRotation', 0);
const [pileItemTint, setPileItemTint] = setter(
  'pileItemTint',
  DEFAULT_PILE_ITEM_TINT
);

const [focusedPiles, setFocusedPiles] = setter('focusedPiles', []);

const [magnifiedPiles, setMagnifiedPiles] = setter('magnifiedPiles', []);

// 'originalPos' and 'closestPos'
const [depileMethod, setDepileMethod] = setter('depileMethod', 'originalPos');

const [depiledPile, setDepiledPile] = setter('depiledPile', []);

const [temporaryDepiledPiles, setTemporaryDepiledPiles] = setter(
  'temporaryDepiledPiles',
  []
);

// 'horizontal' or 'vertical'
const [tempDepileDirection, setTempDepileDirection] = setter(
  'tempDepileDirection',
  'horizontal'
);

const [tempDepileOneDNum, setTempDepileOneDNum] = setter(
  'tempDepileOneDNum',
  6
);

const [easing, setEasing] = setter('easing', cubicInOut);

const [navigationMode, setNavigationMode] = setterOptions(
  'navigationMode',
  NAVIGATION_MODES,
  NAVIGATION_MODE_AUTO
);

const [previewItemOffset, setPreviewItemOffset] = setter('previewItemOffset');

const [previewAlignment, setPreviewAlignment] = setter(
  'previewAlignment',
  'top'
);

const [previewPadding, setPreviewPadding] = setter('previewPadding', 2);

const [previewScaling, setPreviewScaling] = setter('previewScaling', [1, 1]);

const [
  previewScaleToCover,
  setPreviewScaleToCover,
] = setter('previewScaleToCover', [false, false]);

const [previewSpacing, setPreviewSpacing] = setter('previewSpacing', 2);

const [previewOffset, setPreviewOffset] = setter('previewOffset', 2);

const [previewBackgroundColor, setPreviewBackgroundColor] = setter(
  'previewBackgroundColor',
  DEFAULT_PREVIEW_BACKGROUND_COLOR
);

const [previewBackgroundOpacity, setPreviewBackgroundOpacity] = setter(
  'previewBackgroundOpacity',
  DEFAULT_PREVIEW_BACKGROUND_OPACITY
);

const [previewBorderColor, setPreviewBorderColor] = setter(
  'previewBorderColor'
);

const [previewBorderOpacity, setPreviewBorderOpacity] = setter(
  'previewBorderOpacity',
  0.85
);

const [pileBackgroundColor, setPileBackgroundColor] = setter(
  'pileBackgroundColor'
);
const [pileBackgroundOpacity, setPileBackgroundOpacity] = setter(
  'pileBackgroundOpacity',
  0
);
const [pileBackgroundColorHover, setPileBackgroundColorHover] = setter(
  'pileBackgroundColorHover'
);
const [pileBackgroundOpacityHover, setPileBackgroundOpacityHover] = setter(
  'pileBackgroundOpacityHover',
  0.85
);
const [pileBackgroundColorFocus, setPileBackgroundColorFocus] = setter(
  'pileBackgroundColorFocus'
);
const [pileBackgroundOpacityFocus, setPileBackgroundOpacityFocus] = setter(
  'pileBackgroundOpacityFocus'
);
const [pileBackgroundColorActive, setPileBackgroundColorActive] = setter(
  'pileBackgroundColorActive'
);
const [pileBackgroundOpacityActive, setPileBackgroundOpacityActive] = setter(
  'pileBackgroundOpacityActive'
);

const [pileBorderColor, setPileBorderColor] = setter(
  'pileBorderColor',
  0x808080
);
const [pileBorderOpacity, setPileBorderOpacity] = setter(
  'pileBorderOpacity',
  1.0
);
const [pileBorderColorHover, setPileBorderColorHover] = setter(
  'pileBorderColorHover',
  0x808080
);
const [pileBorderOpacityHover, setPileBorderOpacityHover] = setter(
  'pileBorderOpacityHover',
  1.0
);
const [pileBorderColorFocus, setPileBorderColorFocus] = setter(
  'pileBorderColorFocus',
  0xeee462
);
const [pileBorderOpacityFocus, setPileBorderOpacityFocus] = setter(
  'pileBorderOpacityFocus',
  1.0
);
const [pileBorderColorActive, setPileBorderColorActive] = setter(
  'pileBorderColorActive',
  0xffa5da
);
const [pileBorderOpacityActive, setPileBorderOpacityActive] = setter(
  'pileBorderOpacityActive',
  1.0
);

const [pileBorderSize, setPileBorderSize] = setter('pileBorderSize', 0);

// 'topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center'
const [pileCellAlignment, setPileCellAlignment] = setter(
  'pileCellAlignment',
  'topLeft'
);

const [pileContextMenuItems, setPileContextMenuItems] = setter(
  'pileContextMenuItems',
  []
);

const [pileSizeBadge, setPileSizeBadge] = setter('pileSizeBadge', false);

const [pileSizeBadgeAlign, setPileSizeBadgeAlign] = setter(
  'pileSizeBadgeAlign',
  DEFAULT_PILE_SIZE_BADGE_ALIGN
);

const [pileVisibilityItems, setPileVisibilityItems] = setter(
  'pileVisibilityItems',
  true
);

const [pileOpacity, setPileOpacity] = setter('pileOpacity', 1.0);

const [pileScale, setPileScale] = setter('pileScale', 1.0);

const [zoomScale, setZoomScale] = setter('zoomScale', 1.0);

// Label
const [pileLabel, setPileLabel] = setter('pileLabel');
const [pileLabelColor, setPileLabelColor] = setter('pileLabelColor');
const [pileLabelText, setPileLabelText] = setter('pileLabelText', false);
const [pileLabelTextMapping, setPileLabelTextMapping] = setter(
  'pileLabelTextMapping',
  false
);
const [pileLabelTextColor, setPileLabelTextColor] = setter(
  'pileLabelTextColor',
  0x000000
);
const [pileLabelTextOpacity, setPileLabelTextOpacity] = setter(
  'pileLabelTextOpacity',
  1
);
const [pileLabelTextStyle, setPileLabelTextStyle] = setter(
  'pileLabelTextDropShadow',
  {}
);
const [pileLabelAlign, setPileLabelAlign] = setter('pileLabelAlign', 'bottom');
const [pileLabelStackAlign, setPileLabelStackAlign] = setter(
  'pileLabelStackAlign',
  'horizontal'
);
const [pileLabelFontSize, setPileLabelFontSize] = setter(
  'pileLabelFontSize',
  7
);
const [pileLabelHeight, setPileLabelHeight] = setter('pileLabelHeight', 2);
const [pileLabelSizeTransform, setPileLabelSizeTransform] = setter(
  'pileLabelSizeTransform'
);

const [projector, setProjector] = setter('projector');

const [zoomBounds, setZoomBounds] = setter('zoomBounds', [-Infinity, Infinity]);

const items = (previousState = {}, action) => {
  switch (action.type) {
    case 'SET_ITEMS': {
      const useCustomId = action.payload.items.length
        ? typeof action.payload.items[0].id !== 'undefined'
        : false;

      return action.payload.items.reduce((newState, item, index) => {
        const id = useCustomId ? item.id : index;
        newState[id] = {
          id,
          index,
          ...item,
        };
        return newState;
      }, {});
    }

    default:
      return previousState;
  }
};

const setItems = (newItems) => ({
  type: 'SET_ITEMS',
  payload: { items: newItems },
});

const piles = (previousState = {}, action) => {
  switch (action.type) {
    case 'SET_PILES': {
      return Object.entries(action.payload.piles).reduce(
        (newState, [pileId, pileState], index) => {
          newState[pileId] = {
            ...pileState,
            id: pileId,
            index: Number.isNaN(+pileState.index) ? index : +pileState.index,
          };
          return newState;
        },
        {}
      );
    }

    case 'INIT_PILES': {
      const useCustomItemId = action.payload.newItems.length
        ? typeof action.payload.newItems[0].id !== 'undefined'
        : false;

      const newItemIds = action.payload.newItems.reduce(
        (itemIds, item, index) => {
          const id = item.id === undefined ? index.toString() : item.id;
          itemIds.add(id);
          return itemIds;
        },
        new Set()
      );

      return action.payload.newItems.reduce((newState, item, index) => {
        const itemId = useCustomItemId ? item.id : index.toString();

        const previousPileState = previousState[itemId];
        const newPileState = {
          id: itemId,
          index,
          items: [itemId],
          x: null,
          y: null,
          ...previousPileState,
        };

        if (previousPileState) {
          if (previousPileState.items.length) {
            newPileState.items = previousPileState.items.filter((id) =>
              newItemIds.has(id)
            );
          } else if (newItemIds.has(itemId)) {
            const isItemOnPile = Object.values(previousState).filter(
              (pile) => pile.items.includes(itemId) && newItemIds.has(pile.id)
            ).length;
            if (!isItemOnPile) newPileState.items = [itemId];
          }
        }

        newState[itemId] = newPileState;

        return newState;
      }, {});
    }

    case 'MERGE_PILES': {
      const newState = { ...previousState };

      let target;

      if (
        action.payload.targetPileId === undefined &&
        // eslint-disable-next-line no-restricted-globals
        isNaN(action.payload.pileIds[0])
      ) {
        target = action.payload.pileIds[0];
      } else {
        target =
          action.payload.targetPileId !== undefined
            ? action.payload.targetPileId
            : Math.min.apply([], action.payload.pileIds).toString();
      }
      const sourcePileIds = action.payload.pileIds.filter(
        (id) => id !== target
      );

      const [x, y] = action.payload.targetPos;

      newState[target] = {
        ...newState[target],
        items: [...newState[target].items],
        x,
        y,
      };

      sourcePileIds.forEach((id) => {
        newState[target].items.push(...newState[id].items);
        newState[id] = {
          ...newState[id],
          items: [],
          x: null,
          y: null,
        };
      });

      return newState;
    }

    case 'MOVE_PILES': {
      const newState = { ...previousState };
      action.payload.movingPiles.forEach(({ id, x, y }) => {
        newState[id] = {
          ...newState[id],
          x,
          y,
        };
      });
      return newState;
    }

    case 'SCATTER_PILES': {
      const scatterPiles = action.payload.piles.filter(
        (pile) => pile.items.length > 1
      );

      if (!scatterPiles.length) return previousState;

      const newState = { ...previousState };

      scatterPiles.forEach((pile) => {
        pile.items.forEach((itemId) => {
          newState[itemId] = {
            ...newState[itemId],
            items: [itemId],
            x: pile.x,
            y: pile.y,
          };
        });
      });
      return newState;
    }

    case 'SPLIT_PILES': {
      if (!Object.values(action.payload.piles).length) return previousState;

      const newState = { ...previousState };

      // The 0th index represents the groups that is kept on the source pile
      Object.entries(action.payload.piles)
        // If there is only one split group we don't have to do anything
        .filter((splittedPiles) => splittedPiles[1].length > 1)
        .forEach(([source, splits]) => {
          splits.forEach((itemIds) => {
            newState[itemIds[0]] = {
              ...newState[itemIds[0]],
              x: newState[source].x,
              y: newState[source].y,
              items: [...itemIds],
            };
          });
        });
      return newState;
    }

    default:
      return previousState;
  }
};

// action
const initPiles = (newItems) => ({
  type: 'INIT_PILES',
  payload: { newItems },
});

const mergePiles = (pileIds, targetPos, targetPileId) => ({
  type: 'MERGE_PILES',
  payload: { pileIds, targetPos, targetPileId },
});

const movePiles = (movingPiles) => ({
  type: 'MOVE_PILES',
  payload: { movingPiles },
});

const scatterPiles = (pilesToBeScattered) => ({
  type: 'SCATTER_PILES',
  payload: { piles: pilesToBeScattered },
});

const splitPiles = (pilesToBeSplit) => ({
  type: 'SPLIT_PILES',
  payload: { piles: pilesToBeSplit },
});

const setPiles = (newPiles) => ({
  type: 'SET_PILES',
  payload: { piles: newPiles },
});

const [showSpatialIndex, setShowSpatialIndex] = setter(
  'showSpatialIndex',
  false
);

const createStore = () => {
  let lastAction = null;

  const reducers = {
    arrangementObjective,
    arrangementOptions,
    arrangementType,
    arrangeOnGrouping,
    backgroundColor,
    coverRenderer,
    cellAspectRatio,
    cellPadding,
    cellSize,
    columns,
    coverAggregator,
    depiledPile,
    depileMethod,
    dimensionalityReducer,
    easing,
    focusedPiles,
    gridColor,
    gridOpacity,
    groupingObjective,
    groupingOptions,
    groupingType,
    darkMode,
    popupBackgroundOpacity,
    itemRenderer,
    items,
    itemSize,
    itemSizeRange,
    lassoFillColor,
    lassoFillOpacity,
    lassoShowStartIndicator,
    lassoStartIndicatorOpacity,
    lassoStrokeColor,
    lassoStrokeOpacity,
    lassoStrokeSize,
    magnifiedPiles,
    navigationMode,
    orderer,
    pileBackgroundColor,
    pileBackgroundColorActive,
    pileBackgroundColorFocus,
    pileBackgroundColorHover,
    pileBackgroundOpacity,
    pileBackgroundOpacityActive,
    pileBackgroundOpacityFocus,
    pileBackgroundOpacityHover,
    pileBorderColor,
    pileBorderColorActive,
    pileBorderColorFocus,
    pileBorderColorHover,
    pileBorderOpacity,
    pileBorderOpacityActive,
    pileBorderOpacityFocus,
    pileBorderOpacityHover,
    pileBorderSize,
    pileCellAlignment,
    pileContextMenuItems,
    pileCoverInvert,
    pileCoverScale,
    pileItemOffset,
    pileItemBrightness,
    pileItemInvert,
    pileItemOpacity,
    pileOrderItems,
    pileItemRotation,
    pileItemTint,
    pileLabel,
    pileLabelAlign,
    pileLabelColor,
    pileLabelFontSize,
    pileLabelHeight,
    pileLabelStackAlign,
    pileLabelSizeTransform,
    pileLabelText,
    pileLabelTextColor,
    pileLabelTextMapping,
    pileLabelTextOpacity,
    pileLabelTextStyle,
    pileOpacity,
    piles,
    pileScale,
    pileSizeBadge,
    pileSizeBadgeAlign,
    pileVisibilityItems,
    previewAggregator,
    previewAlignment,
    previewBackgroundColor,
    previewBackgroundOpacity,
    previewBorderColor,
    previewBorderOpacity,
    previewItemOffset,
    previewOffset,
    previewPadding,
    previewRenderer,
    previewScaleToCover,
    previewScaling,
    previewSpacing,
    projector,
    rowHeight,
    splittingObjective,
    splittingOptions,
    splittingType,
    showGrid,
    showSpatialIndex,
    tempDepileDirection,
    tempDepileOneDNum,
    temporaryDepiledPiles,
    zoomBounds,
    zoomScale,
  };

  const appReducer = combineReducers(reducers);

  const warnForUnknownImportProps = (newState) => {
    const unknownProps = Object.keys(newState)
      .reduce((unknown, prop) => {
        if (reducers[prop] === undefined) {
          unknown.push(`"${prop}"`);
        }
        return unknown;
      }, [])
      .join(', ');
    if (unknownProps) {
      console.warn(
        `The following state properties are not understood and will not imported: ${unknownProps}`
      );
    }
  };

  const rootReducer = (state, action) => {
    lastAction = action;

    if (action.type === 'RESET') {
      state = undefined; // eslint-disable-line no-param-reassign
    } else if (action.type === 'OVERWRITE') {
      if (action.payload.debug)
        warnForUnknownImportProps(action.payload.newState);
      state = action.payload.newState; // eslint-disable-line no-param-reassign
    } else if (action.type === 'SOFT_OVERWRITE') {
      if (action.payload.debug)
        warnForUnknownImportProps(action.payload.newState);
      // eslint-disable-next-line no-param-reassign
      state = update(state, action.payload.newState, true);
    }

    return appReducer(state, action);
  };

  const reduxStore = createReduxStore(enableBatching(rootReducer));

  reduxStore.lastAction = () => lastAction;

  Object.defineProperty(reduxStore, 'lastAction', {
    get: () => lastAction,
  });

  const exportState = () => {
    const clonedState = deepClone(reduxStore.getState());
    clonedState.version = version;
    return clonedState;
  };

  const importState = (
    newState,
    { overwriteState = false, debug = false } = {}
  ) => {
    if (newState.version !== version) {
      console.warn(
        `The version of the imported state "${newState.version}" doesn't match the library version "${version}". Use at your own risk!`
      );
    }

    if (newState.version) delete newState.version;

    if (overwriteState) reduxStore.dispatch(overwrite(newState, debug));
    else reduxStore.dispatch(softOverwrite(newState, debug));
  };

  const resetState = () => {
    reduxStore.dispatch(reset());
  };

  return pipe(
    withStaticProperty('reduxStore', reduxStore),
    withReadOnlyProperty('lastAction', () => lastAction),
    withReadOnlyProperty('state', reduxStore.getState),
    withForwardedMethod('dispatch', reduxStore.dispatch),
    withForwardedMethod('subscribe', reduxStore.subscribe)
  )({
    export: exportState,
    import: importState,
    reset: resetState,
  });
};

export default createStore;

export const createAction = {
  initPiles,
  mergePiles,
  movePiles,
  scatterPiles,
  setPiles,
  setCoverRenderer,
  setArrangementObjective,
  setArrangeOnGrouping,
  setArrangementOptions,
  setArrangementType,
  setBackgroundColor,
  setCellAspectRatio,
  setCellPadding,
  setCellSize,
  setColumns,
  setCoverAggregator,
  setDepiledPile,
  setDepileMethod,
  setDimensionalityReducer,
  setEasing,
  setFocusedPiles,
  setGridColor,
  setGridOpacity,
  setGroupingObjective,
  setGroupingOptions,
  setGroupingType,
  setDarkMode,
  setPopupBackgroundOpacity,
  setItemRenderer,
  setItems,
  setItemSize,
  setItemSizeRange,
  setLassoFillColor,
  setLassoFillOpacity,
  setLassoShowStartIndicator,
  setLassoStartIndicatorOpacity,
  setLassoStrokeColor,
  setLassoStrokeOpacity,
  setLassoStrokeSize,
  setMagnifiedPiles,
  setNavigationMode,
  setOrderer,
  setPileBackgroundColor,
  setPileBackgroundColorActive,
  setPileBackgroundColorFocus,
  setPileBackgroundColorHover,
  setPileBackgroundOpacity,
  setPileBackgroundOpacityActive,
  setPileBackgroundOpacityFocus,
  setPileBackgroundOpacityHover,
  setPileBorderColor,
  setPileBorderColorActive,
  setPileBorderColorFocus,
  setPileBorderColorHover,
  setPileBorderOpacity,
  setPileBorderOpacityActive,
  setPileBorderOpacityFocus,
  setPileBorderOpacityHover,
  setPileBorderSize,
  setPileCellAlignment,
  setPileContextMenuItems,
  setPileCoverInvert,
  setPileCoverScale,
  setPileItemOffset,
  setPileOrderItems,
  setPileItemBrightness,
  setPileItemInvert,
  setPileItemOpacity,
  setPileItemRotation,
  setPileItemTint,
  setPileLabel,
  setPileLabelAlign,
  setPileLabelColor,
  setPileLabelFontSize,
  setPileLabelHeight,
  setPileLabelStackAlign,
  setPileLabelSizeTransform,
  setPileLabelText,
  setPileLabelTextColor,
  setPileLabelTextMapping,
  setPileLabelTextOpacity,
  setPileLabelTextStyle,
  setPileVisibilityItems,
  setPileOpacity,
  setPileScale,
  setPileSizeBadge,
  setPileSizeBadgeAlign,
  setPreviewAggregator,
  setPreviewAlignment,
  setPreviewBackgroundColor,
  setPreviewBackgroundOpacity,
  setPreviewBorderColor,
  setPreviewBorderOpacity,
  setPreviewItemOffset,
  setPreviewOffset,
  setPreviewPadding,
  setPreviewRenderer,
  setPreviewScaleToCover,
  setPreviewScaling,
  setPreviewSpacing,
  setProjector,
  setRowHeight,
  setSplittingObjective,
  setSplittingOptions,
  setSplittingType,
  setShowGrid,
  setShowSpatialIndex,
  setTempDepileDirection,
  setTempDepileOneDNum,
  setTemporaryDepiledPiles,
  setZoomBounds,
  setZoomScale,
  splitPiles,
};
