## Next

_[Changes since v0.9.1](https://github.com/flekschas/piling.js/compare/v0.10.0...master)_

## v0.10.0

- Added `createLibraryAsync()` to automatically wait until piling is fully initialized. The function takes as input the same parameters as `createLibrary()`.

_[Changes since v0.9.0](https://github.com/flekschas/piling.js/compare/v0.9.1...v0.10.0)_

## v0.9.1

- Revert setting `white` as the default background color for SVG renderer factory as it breaks existing examples.

_[Changes since v0.9.0](https://github.com/flekschas/piling.js/compare/v0.9.0...v0.9.1)_

## v0.9.0

- Add `createD3Renderer`, `createVegaLiteRenderer`, and `createObservablePlotRenderer`
- Fix a glitch in the SVG renderer by overwriting any `width`, `height`, and `style` property of the `<svg />` element.
- Provide default options for the SVG renderer factory for convenience
- Switch from `node-sass` to `sass` (dart-sass) to support Node version 12, 14, and 16.

_[Changes since v0.8.0](https://github.com/flekschas/piling.js/compare/v0.8.0...v0.9.0)_

## v0.8.0

- Export `whenInit` promise from a pile instance to easily determine when the instance is initialized. E.g., `piling.whenInit.then(() => { ... })`.
- Add a `Promise` return to `set()` for better async chaining. At the moment the promise immediately resolves unless you change the items. In the latter case, the promise will resolve once the items have been properly updated.

Together with changes from [v0.7.14](#v0.7.14) you can now do stuff like:

```javascript
const piling = createPilingJs(element, { ... });

await piling.whenInit;
// Piling instance has been initialized
await piling.groupBy('category', (item) => item.id % 5);
// Items have been grouped by their ID
await piling.arrangeBy('data', (state) => state.index);
// Piles have been ordered by their index
await piling.set('items', otherItems);
// Scatter plot items have been replaced
await piling.arrangeBy('data', { property: 'year', inverse: true });
// Piles have been arranged by year in descending order
```

_[Changes since v0.7.14](https://github.com/flekschas/piling.js/compare/v0.7.14...v0.8.0)_

## v0.7.14

- Return a `Promise` when calling `groupBy()` to determine when piles have been grouped (#236)
- Fix an issue where `arrangeBy()` would return an unresolvable promise (#234)
- Fix an issue with the badge rendering and async-rendered covers (#235)

_[Changes since v0.7.13](https://github.com/flekschas/piling.js/compare/v0.7.13...v0.7.14)_

## v0.7.13

- Add `debug` as an option to `piling.importState(state, options)` and `createLibraryFromState` to help discover issues with broken state.

_[Changes since v0.7.12](https://github.com/flekschas/piling.js/compare/v0.7.12...v0.7.13)_

## v0.7.12

- Fix an issue with external SVGs which are prefixed with `<?xml` and `<!DOCTYPE` definitions

_[Changes since v0.7.11](https://github.com/flekschas/piling.js/compare/v0.7.11...v0.7.12)_

## v0.7.11

- Export `createUmap` from bundle
- Include missing `piling-dimensionality-reducer` builds into the release

_[Changes since v0.7.10](https://github.com/flekschas/piling.js/compare/v0.7.10...v0.7.11)_

## v0.7.10

- Simplify the matrix renderer: you can now use `matrixRenderer` instead of `matrixRenderer.renderer`

_[Changes since v0.7.9](https://github.com/flekschas/piling.js/compare/v0.7.9...v0.7.10)_

## v0.7.9

- Fix minor visual regression from [v0.7.8](#v078)

_[Changes since v0.7.8](https://github.com/flekschas/piling.js/compare/v0.7.8...v0.7.9)_

## v0.7.8

- Add state serialization options via `exportState({ serialize: true })`
- Export image class `createImage()`
- Fix opacity issues on temporary depiling (#198 and #204)
- Fix issues removing piles on temp depile

_[Changes since v0.7.7](https://github.com/flekschas/piling.js/compare/v0.7.7...v0.7.8)_

## v0.7.7

- Fix `piling.destroy()`

_[Changes since v0.7.5](https://github.com/flekschas/piling.js/compare/v0.7.6...v0.7.7)_

## v0.7.6

- Enforce aggregators to return a promise
- Fix preview scaling
- Fix a regression introduced in #218

_[Changes since v0.7.5](https://github.com/flekschas/piling.js/compare/v0.7.5...v0.7.6)_

## v0.7.5

- Fix an issue when deleting/adding items.

_[Changes since v0.7.4](https://github.com/flekschas/piling.js/compare/v0.7.4...v0.7.5)_

## v0.7.4

- Add `createLibraryFromState` as a named export to simplify the initialization of a piling.js instance from an existing state.
- Allow subsampling of previews
- Allow initializing from previous state using `createPilingJs(element, { ... }, { initFromState: true })`
- Return promise when running `importState()` that resolves once piling.js' state was overridden.

_[Changes since v0.7.3](https://github.com/flekschas/piling.js/compare/v0.7.3...v0.7.4)_

## v0.7.3

- Fix broken import of RBush

_[Changes since v0.7.2](https://github.com/flekschas/piling.js/compare/v0.7.2...v0.7.3)_

## v0.7.2

- Properly replace `browser.env.NODE_ENV` to avoid redux error

_[Changes since v0.7.1](https://github.com/flekschas/piling.js/compare/v0.7.1...v0.7.2)_

## v0.7.1

- Fix bundles
- Update third-party packages

_[Changes since v0.7.0](https://github.com/flekschas/piling.js/compare/v0.7.0...v0.7.1)_

## v0.7.0

- Add `pileLabelTextColor`, `pileLabelTextOpacity`, and `pileLabelTextStyle` (#164)
- Add more pile/item properties and label properties to sidebar
- Add `zoomScale` for efficient zoom-based scaling (#164)
- Rename `pileItemOrder` to `pileOrderItems` to make it a pile property (#194)
- Add piling by selection (i.e., focused piles). See (interactions)[https://piling.js.org/docs/#/README?id=multi-select-grouping] for details.
- Add `pileLabelSizeTransform` property for adjusting the relative size of pile labels. When set to `histogram`, this option can be used to visualizing the distribution of categories on a pile (#167)
- Add some pile/item properties and label properties to sidebar (#158)
- Add the following properties to give more control to the pile background color: (#151)
  - `pileBackgroundColorActive`
  - `pileBackgroundColorFocus`
  - `pileBackgroundColorHover`
  - `pileBackgroundOpacityActive`
  - `pileBackgroundOpacityFocus`
  - `pileBackgroundOpacityHover`
- Add the following properties to define the pile label (#133)
  - `pileLabel`
  - `pileLabelAlign`
  - `pileLabelColor`
  - `pileLabelFontSize`
  - `pileLabelHeight`
  - `pileLabelStackAlign`
  - `pileLabelText`
- Add `pileSizeBadge` and `pileSizeBadgeAlign` to display a badge showing the pile size (#138)
- Add `cellSize` to define the size of the cell (#136)
- Add `splitBy()` and `splitAll()` to scatter piles (#144, #164)
- Add `groupBy()` for layout-, location-, and data-driven piling (#129, #141, #142, #161)
- Add `pileItemOrder` to sort the items on a pile by a callback function
- Add `previewItemOffset` to position previews with a per-item callback function (#113)
- Add `previewOffset` and `previewPadding` and adjust `previewSpacing` to position previews with a per-pile callback function (#148)
- Add `previewScaling` and `previewScaleToCover` to adjust the x and y scaling factor or width/height of previews relative to the cover (#148)
- Add representative [aggregator](https://piling.js.org/docs/#/README?id=representative-renderer) and [renderer](https://piling.js.org/docs/#/README?id=representative-renderer)
- Add `pileItemInvert` and `pileCoverInvert` property for inverting colors
- Add `pileCoverScale` for scaling the cover in comparison to the pile size
- Show spinner during the initial item rendering
- Add placeholder image to cover items during their computation (#132)
- Add support for dynamic item creation and removal (#104)
- Add a spatial example using COVID-19 data from John Hopkins University (#164)
- Add an example of scatterplot piles using the data from [World Bank Open Data](https://data.worldbank.org/) (#130)
- Add example of dynamic renderer for microscopy data from [Codeluppi et al., 2018](http://linnarssonlab.org/osmFISH/) that is based on the [Vitessce Image Viewer](https://github.com/hubmapconsortium/vitessce-image-viewer) (#109)
- Update and expand the Google Quickdraw examples (#172)
- [Docsify the docs](https://piling.js.org/docs)
- Remove `arrangeByOnce()`. Instead use `arrangeBy(..., ..., { onPile: true })`
- Make `arrangeBy` return a promise that resolves once the items have been positioned
- Several perfomance improvements
- Ensure pile covers update as items update (#175)
- Ensure layout is updated properly (#155, #156)
- Ensure item/preview and pile properties can be functional properties (#174)
- Fix pile events (#182)

_[Changes since v0.6.0](https://github.com/flekschas/piling.js/compare/v0.6.0...v0.7.0)_

## v0.6.0

- Remove `randomOffsetRange` and `randomRotationRange`
- Replace `pileItemAlignment` with `pileItemOffset`. Allow `pileItemOffset` and `pileItemRotation` to either be a static value or a callback function
- Add support for browsing in isolation
- Add a joy plot like example for monthly temperature distributions in Berlin Tempelhofer Feld
- Add support for dynamically re-render the items either when their data changes or when the renderer changes
- Add an example of _perfectly overlapping_ piles using a subset of Google Quickdraw Dataset
- Add `previewBorderColor` and `previewBorderOpacity`. Set the default value of `previewBackgroundColor` and `previewBackgroundOpacity` to `'inherit'`
- Add pan&zoom interaction
- Add mouse-only lasso support to provide a unified interface for using the lasso in the scroll and pan&zoom mode
- Add `arrangeBy()` and `arrangeByOnce()` for automatic and data-driven pile arrangements
- Add `pileItemBrightness` to control the brightness of pile items
- Add `pileItemTint` to control the [tint of pile items](https://pixijs.download/dev/docs/PIXI.Sprite.html#tint)
- Add `randomOffsetRange` and `randomRotationRange` properties
- Add item rotation animation
- Add drop-merge animation when using a preview aggregator
- Add support for specifying the `width` and `height` of the SVG image
- Rename `itemOpacity` to `pileItemOpacity` for consistency
- Change pile border to be scale invariant
- Change lasso from <kbd>alt</kbd> to <kbd>shift</kbd> + mouse-down + mouse-move
- Unmagnify magnified piles on drag start
- Fix pile scaling
- Fix grid drawing to update dynamically upon changes to the grid
- Disentangle the pile base scale and magnification

_[Changes since v0.5.0](https://github.com/flekschas/piling.js/compare/v0.5.0...v0.6.0)_

## v0.5.0

- Add the following properties for dynamic styling. Each property accepts a float value or a callback function. See [`DOCS.md`](DOCS.md#pilingsetproperty-value) for details.
  - `pileOpacity`
  - `pileScale`
  - `pileBorderSize`
  - `itemOpacity`
- Rename the following properties for clarity:

  - `itemPadding` is now called `cellPadding`
  - `pileCellAlign` is now called `pileCellAlignment`
  - `itemAlignment` is now called `pileItemAlignment`
  - `itemRotated` is now called `pileItemRotation`

  _[Changes since v0.4.2](https://github.com/flekschas/piling.js/compare/v0.4.2...v0.5.0)_

## v0.4.2

- Refactored the grid:
  - `layout.cellWidth` is now called `layout.columnWidth`
  - `layout.colWidth` is now called `layout.cellWidth`
  - `layout.cellHeight` is now called `layout.rowHeight`
  - `layout.rowHeight` is now called `layout.cellHeight`
  - `layout.colNum` is now called `layout.numColumns`
  - `layout.rowNum` is now called `layout.numRows`
  - All properties but `layout.numRows` are read-only now
- Simplified `resizeHandler()` and debounced it
- Changed the default value of `itemSizeRange` from `[0.7, 0.9]` to `[0.5, 1.0]` to make full use of the cell width
- Changed the default value of `itemPadding` from `0` to `6` to ensure some padding
- Add `gridColor`, `gridOpacity`, and `showGrid` properties

_[Changes since v0.4.1](https://github.com/flekschas/piling.js/compare/v0.4.1...v0.4.2)_

## v0.4.1

- Include ES modules in npm release
- Switch `package.json`'s module to ES module

_[Changes since v0.4.0](https://github.com/flekschas/piling.js/compare/v0.4.0...v0.4.1)_

## v0.4.0

- Add functionality to align piles by the grid via the context menu
- Add a new property called [`pileCellAlign`](DOCS.md#pilingsetproperty-value) to define where the piles are aligned to, which accepts the following values:
  - `topleft`
  - `topRight`
  - `bottomLeft`
  - `bottomRight`
  - `center`
- Add `exportState()` and `importState(newState)` to the library instance to allow saving a state and implementing an undo functionality.
- Add the following [new events](DOCS.md#events):
  - `update`
  - `pileEnter`
  - `pileLeave`
  - `pileFocus`
  - `pileBlur`
  - `pileActive`
  - `pileInactive`
  - `pileDrag`
  - `pileDrop`
- Change the grid layout properties from a nested object called `grid` to the following individual properties that you can set with [`.set()`](DOCS.md#pilingsetproperty-value):

  - `itemSize`
  - `itemPadding`
  - `columns`
  - `rowHeight`
  - `cellAspectRatio`

  Their precedence is as follows:

  - `columns` < `itemSize`
  - `cellAspectRatio` < `rowHeight`

- Update the grid layout on browser window resize

_[Changes since v0.3.0](https://github.com/flekschas/piling.js/compare/v0.3.0...v0.4.0)_

## v0.3.0

- Add properties for setting various colors via [`.set()`](DOCS.md#pilingsetproperty-value):
  - `backgroundColor`
  - `lassoFillColor`
  - `lassoFillOpacity`
  - `lassoStrokeColor`
  - `lassoStrokeOpacity`
  - `lassoStrokeSize`
  - `pileBorderColor`
  - `pileBorderOpacity`
  - `pileBorderColorSelected`
  - `pileBorderOpacitySelected`
  - `pileBorderColorActive`
  - `pileBorderOpacityActive`
  - `pileBackgroundColor`
  - `pileBackgroundOpacity`
- Add `pileContextMenuItems` property to define custom context menu items.
- Redesign default context menu

_[Changes since v0.2.0](https://github.com/flekschas/piling.js/compare/v0.2.0...v0.3.0)_

## v0.2.0

- Add an SVG renderer. See the [lines example](https://flekschas.github.io/piling.js/?example=lines).

_[Changes since v0.1.0](https://github.com/flekschas/piling.js/compare/v0.1.0...v0.2.0)_

## v0.1.0

- Initial release
