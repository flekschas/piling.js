### Next

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
