# Next

## v0.3.0

- Add functionality to align piles by the grid via the context menu
- Add a new property called [`pileCellAlign`](DOCS.md#pilingsetproperty-value) to define where the piles are aligned to, which accepts the following values:
  - `topleft`
  - `topRight`
  - `bottomLeft`
  - `bottomRight`
  - `center`
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
- Redesign default context menu

## v0.2.0

- Add an SVG renderer. See the [lines example](https://flekschas.github.io/piling.js/?example=lines).

## v0.1.0

- Initial release
