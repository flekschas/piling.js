# Documentation

- [Get started](#get-started)
  - [Examples](#examples)
    - [Image](#image)
    - [Matrix](#matrix)
  - [Data](#data)
- [Library](#library)
  - [Constructor](#constructor)
  - [Methods](#methods)
  - [Events](#events)
  - [State](#state)
- [Renderers](#renderers)
  - [Predefined renderers](#predefined-renderers)
    - [Image renderer](#image-renderer)
    - [Matrix renderer](#matrix-renderer)
  - [Define your own renderer](#define-your-own-renderer)
  - [Add renderers to piling.js library](#add-renderers-to-pilingjs-library)
- [Aggregators](#aggregators)
  - [Predefined aggregators](#predefined-aggregators)
    - [Matrix cover aggregator](#matrix-cover-aggregator)
    - [Matrix preview aggregator](#matrix-preview-aggregator)
  - [Define your own aggregator](#define-your-own-aggregator)
  - [Add aggregators to piling.js library](#add-aggregators-to-pilingjs-library)
- [Dimensionality Reducers](#dimensionality-reducers)
  - [Predefined dimensionality reducers](#predefined-dimensionality-reducers)
    - [UMAP dimensionality reducer](#umap-dimensionality-reducer)
  - [Define your own dimensionality reducer](#define-your-own-dimensionality-reducer)
  - [Add dimensionality reducers to piling.js library](#add-dimensionality-reducers-to-pilingjs-library)
- [Interactions](#interactions)

# Get started

## Examples

As a first step for all examples you have to import and instantiate piling.js as follows. The only argument is the dom element you want to render piling.js into.

```javascript
import createPilingJs from 'piling.js';
const piling = createPilingJs(document.getElementById('demo'));
```

### Image

First, import and instantiate an [image renderer](#image-renderer) and add it to our piling.js library. Then, add images to the library.

```javascript
import { createImageRenderer } from 'piling.js';

piling.set('renderer', createImageRenderer());
piling.set('items', [{ src: 'http://example.com/my-fancy-photo.png' }, ...]);
```

### Matrix

First, import and instantiate a matrix renderer. If you want to have the aggregation and 1D previews of matrices when pile them up, you can also instantiate an cover renderer and a preview renderer here. (See [matrix renderer](#matrix-renderer) for more information.)

```javascript
import { createMatrixRenderer } from 'piling.js';

const matrixRenderer = createMatrixRenderer({ colorMap, shape: [3, 3] });
const coverRenderer = createMatrixRenderer({
  colorMap: aggregateColorMap,
  shape: [3, 3]
});
const previewRenderer = createMatrixRenderer({ colorMap, shape: [3, 1] });
```

Then, you need aggregators for the aggregation and previews. So import and instantiate [aggregators](#aggregators), and you can use mean value as the method of aggregation.

```javascript
import {
  createMatrixCoverAggregator,
  createMatrixPreviewAggregator
} from 'piling.js';

const matrixCoverAggregator = createMatrixCoverAggregator('mean');
const matrixPreviewAggregator = createMatrixPreviewAggregator('mean');
```

Then add the renderers and aggregators to our piling.js library. Finally add the matrix data to the library.

```javascript
piling.set('renderer', matrixRenderer);
piling.set('coverRenderer', coverRenderer);
piling.set('previewRenderer', previewRenderer);

piling.set('coverAggregator', matrixCoverAggregator);
piling.set('previewAggregator', matrixPreviewAggregator);

piling.set('items', [{ src: [1, 2, 3, 2, 3, 1, 3, 2, 1]}, ...]);
```

## Data

An array of objects with one required property `src` and other optional user-defined properties:

- `src`: the item data. This can literally be anything. The only requirement
  is that the renderer understands how to render it.

  _Note, mixed data types are currently not supported. I.e., each item is rendered with the same renderer._

**Examples:**

```javascript
// External image data
{
  src: 'https://github.com/test.png'
}

// A base64-encoded image
{
  src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACWUlEQVR4AXTRA5DmMACG4Zxt27Ztm2vbtm3btm3r19m2zdHpu0nW6sxb92mbkEO6x3ssjuc7PvlO4Pn0u8F76XFvte1E8TyWutQYWHo2mqZ58kxv+122QGshVxwqKdgjsEFk4b5lslOzz8RtgXWdMmxr1eBQr8ly4xp0yptr4RN2MWxAJ8DOR/XQUcV1ZQMPEhyPWE8R+jCFOmFtKF/vs/dFE0W/YpuRnX5hh/Scy8OE+mKT52zol4qzh81qZBhIo/vKeccgmb4HSjFnoR0gq9MJcLKNVNpxfAaGyg3GcvtJ7EYa/aqTvpsh5HwQ1sHGKCgpwLMrb/61jglZslnZaM4e15cyEokIGTMQa1cPZch8rbFQd5NFQnY0BIJrePPuDz7+Aaoe30RUeRQMI+W1GDBnpZj4tLUKnK1nvXBr1UJkD+iLEZMJzjuogC53fn5GoaAEoSEWsDu3EfrHl6R0m0aKzNtnjItb1wDTBqGGEOgdWA13wyMwXtmHfRmFL/cn+L1lQ303gEa/Im7bJnCmjsXl2ZPZAzEDCDvmLlmExk2r27rrZLOyGzCVbN9vr64Fzt3LbV16cJ3FvXeXxn4nPKYAO44k+HUDaLKSWgX5ji5Id0lCnF0iK8EmBGmOvqDnC8L8UamvCWVxm/oegVHzhNeOHHkIs5eaYPsBN4gIW8NIwxLBLm7s4VR/F3CKC8DjNGX2CDBktlBiUIgvXj6/gTt3b0Bw+RZqODcRncb5buqWf0XZJCJSVidYqFdg2wHV+bLqzsXGDkkhQv+X3J3nG9/sARLDlxspwgCV8d4y+cSemwAAAABJRU5ErkJggg=='
}

// Matrix data
{
  src: {
    data: [3.1, 2.0, 1.1, 2.1, 3.2, 2.3, 1.0, 2.0, 3.1],
    shape: [3, 3],
    dtype: 'float32'
  }
}

// SVG string
{
  src: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="80" x2="100" y2="20" stroke="blue" /></svg>'
}
```

# Library

## Constructor

#### `const piling = createPilingJs(domElement, options = {});`

**Returns:** a new piling instance.

**Arguments:**

- `domElement`: reference to the DOM element that will host piling.js' canvas
- `options` (optional): an [options object](https://www.codereadability.com/what-are-javascript-options-objects/) for configuration. The [supported properties](#pilingsetproperty-value) are the same as for [`set()`](#pilingsetproperty-value).

## Methods

#### `piling.get(property)`

**Returns:** one of the properties documented in [`set()`](#pilingsetproperty-value)

#### `piling.set(property, value)`

**Arguments:**

- `property`: Either a string defining the property to be set or an object defining key-value pairs to set multiple properties at once.
- `value`: If `property` is a string, `value` is the corresponding value. Otherwise, `value` is ignored.

The list of all understood properties is given below.

**Properties:**

| Name                       | Type                    | Default      | Constraints                                                          | Unsettable |
| -------------------------- | ----------------------- | ------------ | -------------------------------------------------------------------- | ---------- |
| darkMode                   | boolean                 | `false`      |                                                                      | `false`    |
| coverRenderer              | function                |              | see [`renderers`](#renderers)                                        | `true`     |
| backgroundColor            | string or int           | `0x000000`   |                                                                      | `false`    |
| focusedPiles               | array                   | `[]`         | the id of current focused pile                                       | `true`     |
| coverAggregator            | function                |              | see [`aggregators`](#aggregators)                                    | `true`     |
| depiledPile                | array                   | `[]`         | the id of the pile to be depiled                                     | `true`     |
| depileMethod               | string                  | originalPos  | `originalPos` or `closestPos`                                        | `true`     |
| easing                     | function                | cubicInOut   | see [`notes`](#notes)                                                | `true`     |
| gridColor                  | string or int           | `0x787878`   | can be HEX, RGB, or RGBA string or hexadecimal value                 | `false`    |
| gridOpacity                | float                   | `1.0`        | must be in [`0`,`1`]                                                 | `false`    |
| items                      | array                   | `[]`         | see [`data`](#data)                                                  | `false`    |
| itemSize                   | int                     |              | number of pixels                                                     | `true`     |
| itemSizeRange              | array                   | `[0.7, 0.9]` | array of two numbers between (0, 1)                                  | `true`     |
| columns                    | int                     | `10`         | ignored when `itemSize` is defined                                   | `false`    |
| rowHeight                  | int                     |              |                                                                      | `true`     |
| cellAspectRatio            | float                   |              | ignored when `rowHeight` is defined                                  | `false`    |
| cellPadding                | int                     |              |                                                                      | `true`     |
| lassoFillColor             | string or int           | `0xffffff`   | can be HEX, RGB, or RGBA string or hexadecimal value                 | `false`    |
| lassoFillOpacity           | float                   | `0.15`       | must be in [`0`,`1`]                                                 | `false`    |
| lassoShowStartIndicator    | boolean                 | `true`       |                                                                      | `false`    |
| lassoStartIndicatorOpacity | float                   | `0.1`        | must be in [`0`,`1`]                                                 | `false`    |
| lassoStrokeColor           | string or int           | `0xffffff`   | can be HEX, RGB, or RGBA string or hexadecimal value                 | `false`    |
| lassoStrokeOpacity         | float                   | `0.8`        | must be in [`0`,`1`]                                                 | `false`    |
| lassoStrokeSize            | int                     | `1`          | must be greater or equal than `1`                                    | `false`    |
| orderer                    | function                | row-major    | see [`notes`](#notes)                                                | `true`     |
| magnifiedPiles             | array                   | `[]`         | the id of current magnified pile                                     | `true`     |
| navigationMode             | string                  | auto         | Can be one of auto, panZoom, or scroll                               | `false`    |
| pileBackgroundColor        | string or int           | `0x000000`   | can be HEX, RGB, or RGBA string or hexadecimal value                 | `false`    |
| pileBackgroundOpacity      | float                   | `1.0`        | must be in [`0`,`1`]                                                 | `false`    |
| pileBorderColor            | string or int           | `0x808080`   | can be HEX, RGB, or RGBA string or hexadecimal value                 | `false`    |
| pileBorderOpacity          | float                   | `1.0`        | must be in [`0`,`1`]                                                 | `false`    |
| pileBorderColorHover       | string or int           | `0x808080`   | can be HEX, RGB, or RGBA string or hexadecimal value                 | `false`    |
| pileBorderOpacityHover     | float                   | `1.0`        | must be in [`0`,`1`]                                                 | `false`    |
| pileBorderColorFocus       | string or int           | `0xeee462`   | can be HEX, RGB, or RGBA string or hexadecimal value                 | `false`    |
| pileBorderOpacityFocus     | float                   | `1.0`        | must be in [`0`,`1`]                                                 | `false`    |
| pileBorderColorActive      | string or int           | `0xffa5da`   | can be HEX, RGB, or RGBA string or hexadecimal value                 | `false`    |
| pileBorderOpacityActive    | float                   | `1.0`        | must be in [`0`,`1`]                                                 | `false`    |
| pileBorderSize             | float or function       | `0`          | see [`notes`](#notes)                                                | `true`     |
| pileCellAlignment          | string                  | topLeft      | `topLeft`, `topRight`, `bottomLeft`, `bottomRight` or `center`       | `true`     |
| pileContextMenuItems       | array                   | `[]`         | see _examples_ below                                                 | `true`     |
| pileItemBrightness         | string, int or function | `0`          | must be in [-1,1] where `-1` refers to black and `1` refers to white | `false`    |
| pileItemOffset             | array or function       | `[5, 5]`     | see [`notes`](#notes)                                                | `true`     |
| pileItemOpacity            | float or function       | `1.0`        | see [`notes`](#notes)                                                | `true`     |
| pileItemOrder              | function                |              | see [`notes`](#notes)                                                | `true`     |
| pileItemRotation           | float or function       | `0`          | see [`notes`](#notes)                                                | `true`     |
| pileItemTint               | string, int or function | `0xffffff`   | can be HEX, RGB, or RGBA string or hexadecimal value                 | `true`     |
| pileOpacity                | float or function       | `1.0`        | see [`notes`](#notes)                                                | `true`     |
| pileScale                  | float or function       | `1.0`        | see [`notes`](#notes)                                                | `true`     |
| popupBackgroundOpacity     | float                   | `0.85`       | must be in [`0`,`1`]                                                 | `false`    |
| previewAggregator          | function                |              | see [`aggregators`](#aggregators)                                    | `true`     |
| previewBackgroundColor     | string, int             | `'inherit'`  | can be HEX, RGB, or RGBA string or hexadecimal value                 | `false`    |
| previewBackgroundOpacity   | float                   | `'inherit'`  | must be in [`0`,`1`]                                                 | `false`    |
| previewBorderColor         | string or int           | `0xffffff`   | can be HEX, RGB, or RGBA string or hexadecimal value                 | `false`    |
| previewBorderOpacity       | float                   | `0.85`       | must be in [`0`,`1`]                                                 | `false`    |
| previewItemOffset          | function                |              | see [`notes`](#notes)                                                | `true`     |
| previewRenderer            | function                |              | see [`renderers`](#renderers)                                        | `true`     |
| previewSpacing             | number                  | `2`          | the spacing between 1D previews                                      | `true`     |
| renderer                   | function                |              | see [`renderers`](#renderers)                                        | `false`    |
| showGrid                   | boolean                 | `false`      |                                                                      | `false`    |
| tempDepileDirection        | string                  | horizontal   | horizontal or vertical                                               | `true`     |
| tempDepileOneDNum          | number                  | `6`          | the maximum number of items to be temporarily depiled in 1D layout   | `true`     |
| temporaryDepiledPile       | array                   | `[]`         | the id of the pile to be temporarily depiled                         | `true`     |

**Examples and Notes:**

- To set a single property do:

  ```javascript
  piling.set('propertyName', value);
  ```

  To set multiple values at once do:

  ```javascript
  piling.set({
    propertyNameA: valueA,
    propertyNameB: valueB
  });
  ```

- A property is considered unsettable if its value can be removed.

- When `darkMode` is `true` we assume that piling.js is used with a black background and the color of certain UI elements are adjusted automatically

- `orderer` is the function for positioning piles, the default function is row-major orderer which looks like this:

  ```javascript
  // The default row-major order

  // A function that takes as input the number of columns and outputs
  // another function that takes in as input the position of a 1D ordering and
  // outputs the an array of `x` an `y` coordinates.

  const rowMajor = cols => index => [index % cols, Math.floor(index / cols)];
  ```

- The following properties to define the _grid_: `itemSize`, `cellPadding`, `columns`, `rowHeight`, and `cellAspectRatio`

  One has to at least provide `columns` or `itemSize` to define a grid. If `itemSize` is defined `columns` are ignored. Similarly, when `rowHeight` is defined `cellAspectRatio` is ignored.

  When `itemSize` is defined, `itemSize` and `cellPadding` add up together to define the cell width. When `itemSize` is undefined, `itemSize` is defined by the derived cell width (given `columns`) minues `cellPadding`!

- `easing` is the easing function for animation, the default function is `cubicInOut` which looks like this:

  ```javascript
  const cubicInOut = t => {
    t *= 2;
    const p = (t <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
    return p;
  };
  ```

- All color properties (like `backgroundColor`, `lassoFillColor`, etc.) support HEX, RGB, and RGBA string and decimal values. E.g.,

  ```javascript
  piling.set('lassoFillColor', '#ff0000');
  piling.set('lassoFillColor', 'rgb(255, 0, 0)');
  piling.set('lassoFillColor', 'rgba(255, 0, 0, 1)');
  piling.set('lassoFillColor', 0xff0000);
  ```

  Additionally, all lasso and pile related color properties (like `lassoFillColor`, `pileBorderColor`, etc.) support automatic setting of the opacity. E.g.,

  ```javascript
  // The following...
  piling.set('lassoFillColor', 'rgba(255, 0, 0, 0.66)');
  // ...is a shorthand for...
  piling.set('lassoFillColor', 'rgb(255, 0, 0)');
  piling.set('lassoFillOpacity', 0.66);
  ```

- `pileContextMenuItems` is an array of objects, which must have a `label` and `callback` property. Optionally, an object can also specify an `id`, which will be assigned to the corresponding button in the context menu, and `keepOpen: true` to not close the context menu after clicking on the corresponding button. The `callback` function is triggered whenever the user clicks on the corresponding button and it receives the pile definition, which contains the pile id, the ids of the items on the pile, and the pile's x and y coordinate.

  ```javascript
  // Add a custom context menu
  const myClickHandler = pile => {
    console.log('Hi!', pile);
    // The log statement could look as follows for example:
    // Hi!, { id: 5, items: [2, 0, 8], x: 215, y: 8 }
  };
  piling.set('pileContextMenuItems', [
    {
      id: 'my-click',
      label: 'Click me!',
      callback: myClickHandler
    }
  ]);
  ```

- `pileBorderSize`, `pileOpacity` and `pileScale` can be set to a static float value, or the user can specify a callback function to dynamically style piles. E.g.,

  ```javascript
  // Set to a static number
  piling.set('pileScale', 2.0);

  // Set to a callback function
  piling.set('pileOpacity', pile => 1 / pile.items.length);
  ```

  The callback function is evaluated for each pile and receives the current [pile](#statepiles). The function’s return value is then used to set each pile’s corresponding property. I.e., the function signature is as follows:

  ```javascript
  function (pile) {
    // Do something
    return value;
  }
  ```

- `pileItemOffset` can be set to an array or a callback function. The array should be a tuple specifying the x and y offset in pixel. E.g.,

  ```javascript
  // Align items in y-axis
  piling.set('pileItemOffset', [0, 5]);
  ```

  See the next note for the signature of the callback function ⬇️

- `pileItemBrightness`, `pileItemOpacity`, `pileItemRotation` and `pileItemTint` can either be set to a static value or a callback function to dynamically style items. E.g.,

  ```javascript
  // Set to a static number
  piling.set('pileItemOpacity', 0.5);

  // Set to a callback function
  piling.set(
    'pileItemOpacity',
    (item, i, pile) => (pile.items.length - i) / pile.items.length
  );
  ```

  The callback function is evaluated, in order, for each item on every pile and receives the current [item](#stateitems), the item's current index, and [pile](#statepiles) that the item belongs to. The function’s return value is then used to set the opacity of each pile’s item. I.e., the function signature is as follows:

  ```javascript
    function (item, index, pile) {
      // Do something
      return value;
    }
  ```

  The function should return a value within `[0, 1]`.

- The default value of `previewBackgroundColor` and `previewBackgroundOpacity` is `'inherit'`, which means that their value inherits from `pileBackgroundColor` and `pileBackgroundOpacity`. If you want preview's background color to be different from pile's, you can set a specific color.

- `pileItemOrder` is used to sort the items on a pile before positioning the items. It should be set to a callback function which will receive an array of all the [items](#stateitems) on the pile, and should return a `Map` that maps the item's id to its expected index after sorting. E.g.,

  ```javascript
  const pileItemOrder = itemStates => {
    itemStates.sort((a, b) => a.id - b.id);

    const itemIdToIndexMap = new Map();
    itemStates.forEach((item, index) => {
      itemIdToIndexMap.set(item.id.toString(), index);
    });

    return itemIdToIndexMap;
  };

  piling.set('pileItemOrder', pileItemOrder);
  ```

  The signature of the callback function is as follows:

  ```javascript
    function (itemStates) {
      // Sort item states and create a map
      return itemIdToIndexMap;
    }
  ```

- `previewItemOffset` is used to position the previews on a pile as user specified. If it's not set, the preview will be positioned to the top of the cover by default. It should be set to a callback function which receives the current [preview item](#stateitems), the item's current index, and the [pile](#statepiles) that the item belongs to, and it should return a tuple of xy position of the preview. I.e., the function signature is as follows:

  ```javascript
  piling.set('previewItemOffset', (itemState, itemIndex, pileState) => {
    // Calculate the position
    return [x, y];
  });
  ```

#### `piling.arrangeBy(type, objective, options)`

Position piles with user-specified arrangement method.

`type`, `objective`, and `options` can be one of the following combinations:

| Type      | Objective                                                                             | Options  |
| --------- | ------------------------------------------------------------------------------------- | -------- |
| `null`    | `undefined` _(manual positioning)_                                                    |          |
| `'index'` | `function` that returns the linear index                                              |          |
| `'ij'`    | `function` that returns the cell (i.e., ij position) the pile should be positioned in |          |
| `'xy'`    | `function` that returns the final xy position                                         |          |
| `'uv'`    | `function` that returns the final uv position of the canvas                           |          |
| `'data'`  | `string`, `object`, `function`, or `array` of the previous types                      | `object` |

**Notes and examples:**

- The signature of the callback function for types `index`, `ij`, `xy` and `uv` should be as follows:

  ```javascript
  function (pileState, pileId) {
    // Do something
    return pilePosition;
  }
  ```

- When `type === 'data'`, `objective` can either be a `string`, `object`, `function`, or an array of the previous types to produce a 1D ordering, 2D scatter plot, or multi-dimensional cluster plot.

  - The `objective` object can contain the following properties:

    - `property` [type: `string` or `function`]: A function that retrieves that returns a numerical value for an pile's item.

      The signature of the callback function looks as follows and must return a numerical value:

      ```javascript
      function (itemState, itemId, itemIndex) {
        // Do something
        return aNumericalValue;
      }
      ```

      For convenience, we can automatically access item properties by their name. E.g., the following objective are identical:

      ```javascript
      piling.arrangeBy('data', 'a');
      piling.arrangeBy('data', itemState => itemState.a);
      ```

    - `propertyIsVector` [type: `boolean` default: `false`]: If `true` we assume that `property()` is returning a numerical vector instead of a scalar.

    - `aggregator` [type: `string` or `function` default: `mean`]: A function for aggregating the property values of the piles' items.

      For convenience, we provide the following pre-defined aggregators: `min`, `max`, `mean` and `sum`.

    - `scale` [type: `function` default: `d3.scaleLinear`]: A D3 scale function

    - `inverse` [type `boolean` default: `false`]: If `true`, the scale will be inverted

  - For convenience the following examples are all equivalent:

    ```javascript
    // Define the property via a simple string
    piling.arrangeBy('data', 'a');
    // Define the property callback function
    piling.arrangeBy('data', itemState => itemState.a); // callback function
    // Define the property callback function as part of the `objective` object
    piling.arrangeBy('data', { property: itemState => itemState.a });
    // Explicitly define
    piling.arrangeBy('data', ['a']);
    ```

  - 1D orderings, 2D scatter plots, or multi-dimensional cluster plots are defined by the number passed to `arrangeBy('data', objectives)`:

    ```javascript
      // 1D / linear ordering
      piling.arrangeBy('data', ['a']);
      // 2D scatter plot
      piling.arrangeBy('data', ['a', 'b']);
      // Multi dimensional cluster plot
      piling.arrangeBy('data', ['a', 'b', 'c', ...]);
    ```

- When `type === 'data'`, it is possible to further customize the behavior with the following `options`:

  - `forceDimReduction` [type: `boolean` default: `false`]: If `true`, dimensionality reduction is always applied.

    ```javascript
    // This can be useful when the property itself is multidimensional. E.g.:
    const items = [
      {
        src: [0, 1, 1, 13.37, 9, ...]
      },
      ...
    ]
    piling.set('items', items);
    piling.arrangeBy('data', 'src', { forceDimReduction: true });
    ```

  - `runDimReductionOnPiles` [type: `boolean` default: `false`]: If `true`, dimensionality reduction is run on the current grouping status and updated everytime a pile changes.

    By default this is deactivated because dimensionality reduction transformations are often not deterministic and feeding even the same data to the algorithm can lead to vastly different layout. Therefore, by default we run the dimensionality reduction on the individual items and given that learned model position the piles. This allows us to keep the layout stable even as the piles change. If you want more fine-grain control over transformation updates we suggest running a [`dimensionalityReducer`]() separately and using it's transform function in combination with `piling.arrangeBy('uv')` and [`piling.halt()`]()/[`piling.resume()`]().

    ```javascript
    // Turning `runDimReductionOnPiles` on will cause a recalculation of the transformation everytime you change piles!
    piling.arrangeBy('data', ['a', 'b', 'c'], { runDimReductionOnPiles: true });
    ```

#### `piling.arrangeByOnce(type, objective)`

Same as [`arrangeBy()`](#pilingarrangebytype-objective) but it applies the automatic pile arrangement only once and then switches back to manual pile arrangement.

#### `piling.destroy()`

Destroys the piling instance by disposing all event listeners, the pubSub instance, canvas, and the root PIXI container.

#### `piling.halt({ text, spinner = true })`

This will display a popup across the entire piling.js element to temporarily block all interactions. This is useful if you are doing some asynchronous job outside piling and want to prevent user interactions.

#### `piling.render()`

Render the root PIXI container.

#### `piling.resume()`

This will the halting popup.

#### `piling.subscribe(eventName, eventHandler)`

Subscribe to an event.
`eventName` needs to be one of these [events](#events).
`eventHandler` is a callback function which looks like this:

```javascript
const eventHandler = eventData => {
  // handle event here
};
```

#### `piling.unsubscribe(eventName, eventHandler)`

Unsubscribe from an event. See [events](#events) for all the events.

## Events

| Name         | Event Data            | Description                                              |
| ------------ | --------------------- | -------------------------------------------------------- |
| render       |                       | Published when the data has been rendered                |
| update       | `{action}`            | Published when the redux store is updated                |
| pileEnter    | `{pile, sourceEvent}` | Published when the mouse cursor enters a pile            |
| pileLeave    | `{pile, sourceEvent}` | Published when the mouse cursor leaves a pile            |
| pileFocus    | `{pile}`              | Published when the user focuses a pile                   |
| pileBlur     | `{pile}`              | Published when the user blurs a pile                     |
| pileActive   | `{pile}`              | Published when the user temporarily depiles a pile       |
| pileInactive | `{pile}`              | Published when the user closes temporarily depile a pile |
| pileDrag     | `{pile, sourceEvent}` | Published when a pile is started to drag                 |
| pileDrop     | `{pile, sourceEvent}` | Published when a pile is dropped                         |

**Notes:**

- `action` is the name of the action that triggered the update
- `pile` is the [state](#statepiles) of the corresponding pile
- `sourceEvent` is the original browser event that triggered this event

## State

In the following we describe the most important aspects of the library state. This description focuses on the user-facing aspects, primarily the `pile` and `item` state as these are used by dynamic properties and are returned by [events](#events).

#### `state.items`

A list of objects storing the [item data](#data)

**Type:** Array of Objects

**Example:**

_See the examples at [#Data](#data)_

#### `state.piles`

A list of objects with the following properties:

- `items`: a list of item IDs
- `x`: the current x position
- `y`: the current y position

**Type:** Array of Objects

**Example:**

```javascript
[
  {
    items: [5, 12],
    x: 10,
    y: 10
  },
  ...
]
```

# Renderers

A renderer should be a function that takes as input an array of the value of `src` property in your data that determining the source, and outputs promises which resolve to [Pixi Texture objects](http://pixijs.download/release/docs/PIXI.Texture.html).

## Renderer types

Piling.js support three types of renderer:

- `itemRenderer`: responsible for rendering items.
- `coverRenderer`: responsible for rendering the cover of a pile.
- `previewRenderer`: responsible for rendering item previews.

## Predefined renderers

Piling.js ships with the following set of renderers, which can be imported from `piling.js`.

- [`createImageRenderer`](#image-renderer): renders image data.
- [`createMatrixRenderer`](#matrix-renderer): renders a numerical matrix as a heatmap.
- [`createSvgRenderer`](svg-renderer): renders an SVG element. Useful when you're working with [D3](https://github.com/d3/d3).
- [`createRepresentativeRenderer`](#representative-renderer): renders multiple items into one gallery of representatives.

### Image renderer

**Constructor:**

```javascript
import { createImageRenderer } from 'piling.js';
const imageRenderer = createImageRenderer();
```

**Src/Data:** image renderer can currently render images from an URL or base64 encoding. I.e., the `src` property in your [data](#data) needs be URL pointing to an image or the base64 encoding of an image.

### SVG renderer

**Constructor:**

```javascript
import { createSvgRenderer } from 'piling.js';
const svgRenderer = createSvgRenderer(options);
```

**Src/Data:** The SVG renderer can render SVG strings and SVG DOM elements.

**Options** is an object of key-value pairs with support for the following properties:

| Name       | Type   | Default | Constraints                             |
| ---------- | ------ | ------- | --------------------------------------- |
| width      | int    |         | Width of the rendered texture in pixel  |
| height     | int    |         | Height of the rendered texture in pixel |
| color      | string |         | A valid CSS color property              |
| background | string |         | A valid CSS background property         |

### Matrix renderer

**Constructor:**

```javascript
import { createMatrixRenderer } from 'piling.js';
const matrixRenderer = createMatrixRenderer(properties);
```

**Src/Data:** The matrix renderer requires that an item provides a src object of the following form:

```javascript
{
  data: [1, 2, 3, 4],
  shape: [2, 2],
  dtype: 'float32'
}
```

**Properties** is an object of key-value pairs. The list of all understood properties is given below.

| Name     | Type   | Default | Constraints   |
| -------- | ------ | ------- | ------------- |
| colorMap | array  |         | Array of rgba |
| shape    | array  |         | Matrix shape  |
| minValue | number | `0`     |               |
| maxValue | number | `1`     |               |

_Note:_ `shape` describes the size of matrix, e.g., for a 4x5 matrix, `shape` should be `[4, 5]`

**Examples:**

```javascript
import { interpolateRdPu } from 'd3-scale-chromatic';
import createMatrixRenderer from 'piling.js';

const rgbStrToRgba = (rgbStr, alpha = 1) => {
  return [
    ...rgbStr
      .match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      .slice(1, 4)
      .map(x => parseInt(x, 10) / 256),
    alpha
  ];
};
const numColors = 256;
const colorMap = new Array(numColors)
  .fill(0)
  .map((x, i) => rgbStrToRgba(interpolateRdPu(i / numColors)));

const matrixRenderer = createMatrixRenderer({ colorMap, shape: [16, 16] });
```

_Note:_

You can pass in different color map or shape to create `aggregateRender` for matrix aggregation and `previewRender` for matrix preview, so that the pile will have an aggregation of all the matrices on the pile cover, and matrix previews on top of the aggregation.

For example:

```javascript
const aggregateColorMap = new Array(numColors)
  .fill(0)
  .map((x, i) => rgbStr2rgba(interpolateOrRd((numColors - i) / numColors)));

const coverRenderer = createMatrixRenderer({
  colorMap: aggregateColorMap,
  shape: [16, 16]
});

const previewRenderer = createMatrixRenderer({ colorMap, shape: [16, 1] });
```

Note, you also need to define the appropriate cover and preview [aggregators](#aggregators) for this to work.

### Representative renderer

**Constructor:**

```javascript
import { createRepresentativeRenderer } from 'piling.js';
const representativeRenderer = createRepresentativeRenderer(
  itemRenderer,
  options
);
```

**Src/Data:** Since the item-based rendering is done by `itemRenderer`, the data needs to be in a format understood by `itemRenderer`.

**itemRenderer:** The basic item renderer.

**Options** is an object of key-value pairs with support for the following properties:

| Name                       | Type | Default    | Constraints                                                                                                                                      |
| -------------------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| size                       | int  | `96`       | Size of the longer side, which is determined by the number of representatives                                                                    |
| innerPadding               | int  | `2`        | Padding in pixels between representative images                                                                                                  |
| outerPadding               | int  | `0`        | Padding in pixels the the outer border                                                                                                           |
| maxNumberOfRepresentatives | int  | `9`        | Maximum number of representatives to be shown. You can typically ignore this setting as this number is derived by the representative aggregator. |
| backgroundColor            | int  | `0x000000` | A background color for the gallery in form of a hexa-decimal number                                                                              |

_Note:_

- The representative renderer really only makes sense as the [`coverRenderer`](#renderer-types)
- The representative renderer only works if you also specify [`representativeAggregator`](#representative-aggregator)

## Define your own renderer

If you want to define your own renderer to render your own data, you can do something as follows:

```javascript
// The actual renderer
const renderCustomTexture = (src, options) => {
  // A complicated function that turns the src into a PIXI texture object
  return PIXI.Texture.from(...);
}

// Factory function
const createCustomRenderer = options => sources => {
  Promise.all(
    sources.map(src => {
      return new Promise((resolve, reject) => {
        const texture = renderCustomTexture(src, options);

        if (!texture) reject(new Error('Could not render texture'));

        resolve(texture);
      });
    })
  )
};
```

## Add renderers to piling.js library

Call [set](#pilingsetproperty-value) method to add renderers to the library.

```javascript
// for all the items
piling.set('renderer', matrixRenderer); // the same for imageRenderer

// for the aggregation of a pile
piling.set('coverRenderer', coverRenderer);

// for the item preview
piling.set('previewRenderer', previewRenderer);
```

# Aggregators

Aggregators are used to aggregate items.

An aggregator is a function that takes as input an array of items and outputs a promise which resolve to an array of aggregated **source values** that can be passed to the [renderers](#renderers).

## Aggregator types

Piling.js support three types of renderer:

- `coverAggregagtor`: responsible for aggregagting items for the cover.
- `previewAggregagtor`: responsible for aggregagting full items to previews items.

## Predefined aggregators

Piling.js ships with the following set of aggregators, which can be imported from `piling.js`.

- [`createMatrixCoverAggregator`](#matrix-cover-aggregator): aggregates numerical matrixs.
- [`createMatrixPreviewAggregator`](#matrix-preview-aggregator): aggregates a numerical matrix to a numerical vector.
- [`createRepresentativeAggregator`](#representative-aggregator): aggregates multiple items to a set of representatives items.

### Matrix cover aggregator

The aggregator for all the matrices on a pile, it will be shown on the cover of the pile.

**Constructor:**

```javascript
import { createMatrixCoverAggregator } from 'piling.js';
const matrixCoverAggregator = createMatrixCoverAggregator(aggregator);
```

- **`Aggregator`** is the method of aggregation, could be `'mean'`, `'variance'`, `'std'`. The default value is `'mean'`.

### Matrix preview aggregator

The 1D preview aggregator for each matrix on a pile, it will be shown on top of the pile cover.

**Constructor:**

```javascript
import { createMatrixPreviewAggregator } from 'piling.js';
const matrixPreviewAggregator = createMatrixPreviewAggregator(aggregator);
```

- **`Aggregator`** is the method of aggregation, could be `'mean'`, `'variance'`, `'std'`. The default value is `'mean'`.

### Representative aggregator

The representative aggregator selects `k` number of representative items from all the items on a pile.

**Constructor:**

```javascript
import { createRepresentativeAggregator } from 'piling.js';
const representativeAggregator = createRepresentativeAggregator(k, options);
```

The representative aggregator uses kmeans++ to determine `k` clusters in the data and then selects the items closest to the cluster centroids. See [piling.js.org/?example=vitessce](https://piling.js.org/?example=vitessce) for an example.

- **`k`:** the number of representatives to select.

- **`options`:** is an object of key-value pairs with support for the following properties:

  | Name             | Type               | Default           | Constraints                                                                                                                                  |
  | ---------------- | ------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
  | distanceFunction | function or string | `l2`              | The string can be one of `l1`, `mahattan`, `l2`, `euclidean` and falls back to `l2`                                                          |
  | initialization   | array or string    | `kmpp`            | A list of initial centroids or `kmeans++` initialization                                                                                     |
  | maxIterations    | int                | `1000 * log10(n)` | A valid CSS color property                                                                                                                   |
  | valueGetter      | function           | `x => x`          | A function defining how to access the data representation to be used for clustering. The accessed value must either be a number or an array. |

## Define your own aggregator

If you want to define your own aggregator, you can do something as follows:

```javascript
const customAggregator = items =>
  new Promise((resolve, reject) => {
    // Aggregate items somehow
    const aggregatedSrc = myMagicAggregation(items);

    if (!aggregatedSrc) reject(new Error('Aggregation failed'));

    // The resolve source must be understood by the aggregate renderer!
    resolve(aggregatedSrc);
  });
```

## Add aggregators to piling.js library

Call [set](#pilingsetproperty-value) method to add aggregators to the library.

```javascript
piling.set('coverAggregator', coverAggregator);
piling.set('previewAggregator', previewAggregator);
```

# Dimensionality Reducers

A dimensionality reducer is a transformation function that that reduced multi-dimensional input data down to two normalized dimension.

A dimensionality reducer should be a function that takes as input a 2D nested numerical array, and output promises which resolve to an array of aggregated source value that can be passed to the [renderers](#renderers).

## Predefined dimensionality reducers

We currently provide predefined dimensionality reducers for [UMAP](https://github.com/PAIR-code/umap-js).

### UMAP dimensionality reducer

The 1D preview aggregator for each matrix on a pile, it will be shown on top of the pile cover.

**Constructor:**

```javascript
import { createUmap } from 'piling.js';
const umap = createUmap(config, options);
```

- **`config`** is an `object` that lets you [customize UMAP's parameters](https://github.com/PAIR-code/umap-js#parameters).
- **`options`** is an `object` for customizing the output transformation with the follwing properties:

| Name    | Type  | Default | Constraints               |
| ------- | ----- | ------- | ------------------------- |
| padding | float | `0.1`   | Must be greater than zero |

## Define your own dimensionality reducer

If you want to define your own dimensionality reducer, you can do something as follows:

```javascript
// Factory function
const createCustomAggregator = () => {
  // Your code here

  return {
    fit(data) {
      // The following function must be asynchronous and return a promise that
      // resolves once the fitting is done.
      return asyncFitFunction(data);
    },
    transform(data) {
      return getTransformedData(data);
    }
  };
};
```

## Add dimensionality reducers to piling.js library

Call [set](#pilingsetproperty-value) method to add aggregators to the library.

```javascript
piling.set('dimensionalityReducer', umap);
```

# Interactions

- **Create a pile or merge piles:**
  - Drag one item/pile and drop it on another with your mouse.
  - Click on the background and drag your mouse to draw a lasso. All items/piles within the lasso will be merged into one pile.
- **Browse a pile:**
  - Click on a pile to focus on this pile, then hover your mouse on one item's preview to see the item.
- **Temporarily de-pile:**
  - Double click on a pile to temporarily de-pile the pile. Then double click on the pile again or on the background to close temporarily de-pile.
  - Right click on a pile to open the context menu. Click on <kbd>temp depile</kbd> button to temporarily de-pile the pile. Then right click on the pile again and click on <kbd>close temp depile</kbd> button to close temporarily de-pile.
- **De-pile:**
  - While pressing <kbd>SHIFT</kbd>, click on a pile to de-pile it.
  - Right click on a pile to open the context menu. Click on <kbd>depile</kbd> button to de-pile.
- **Magnify a pile:**
  - While pressing <kbd>ALT</kbd>, click on a pile to automatically magnify it.
  - While pressing <kbd>ALT</kbd>, click on a magnified pile to automatically unmagnify it.
  - While pressing <kbd>ALT</kbd>, hover on a pile and scroll to manually magnify it. Then click on the background to automatically unmagnify it.
  - Right click on a pile to open the context menu. Click on <kbd>magnify</kbd> button to automatically magnify the pile.
  - Right click on a magnified pile to open the context menu. Click on <kbd>unmagnify</kbd> button to automatically unmagnify the pile.
- **Show grid:**
  - Right click on the background to open the context menu. Click on <kbd>show grid</kbd> button to show the grid.
  - If the grid is shown, right click on the background and click on <kbd>hide grid</kbd> button to hide the grid.
- **Context menu:**
  - Right click will open the custormized context menu.
  - While pressing <kbd>ALT</kbd>, right click will show the default context menu in the browser.
