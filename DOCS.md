<h1 id="home" align="center">
  The Piling.js Docs
</h1>

<div align="center">
  
  [![NPM Version](https://img.shields.io/npm/v/piling.js.svg?style=flat-square&color=7f99ff)](https://npmjs.org/package/piling.js)
  [![Build Status](https://img.shields.io/travis/flekschas/piling.js?color=a17fff&style=flat-square)](https://travis-ci.org/flekschas/piling.js/)
  [![File Size](http://img.badgesize.io/https://unpkg.com/piling.js/dist/piling.min.js?compression=gzip&style=flat-square&color=e17fff)](https://unpkg.com/piling.min.js)
  [![Code Style Prettier](https://img.shields.io/badge/code%20style-prettier-ff7fe1.svg?style=flat-square)](https://github.com/prettier/prettier#readme)
  [![Demo](https://img.shields.io/badge/demo-👍-ff7fa5.svg?style=flat-square)](https://piling.js.org)
  
</div>

<div id="teaser-matrices" align="center">
  
  ![Preview](https://user-images.githubusercontent.com/932103/77213358-eecf4100-6ae0-11ea-803f-bf8368cd81d8.gif)
  
</div>

# Getting Started

## Install

```bash
npm install piling.js
```

## Quick Start

The bare minimum you need to define to get started with piling.js are the following two thing:

1. A list of objects with a `src` property
2. A renderer that understands how to render `src` into an image

```javascript
// import the piling.js library
import createPilingJs from 'piling.js';
// import the predefined image renderer
import { createImageRenderer } from 'piling.js';

// define your dataset
const data = [{ src: 'http://example.com/my-fancy-photo.png' }, ...];

// instantiate and configure the piling.js library
// 'demo' is the dom element which piling.js will be rendered in
const piling = createPilingJs(
  document.getElementById('demo'),    // dom element in which piling.js will be rendered
  {
    renderer: createImageRenderer(),  // use the image renderer for rendering
    items: data,                      // add the images
  }
);
```

Et voilà 🎉

![teaser-natural-images](https://user-images.githubusercontent.com/932103/65775958-24d1d080-e10f-11e9-8d12-5aaf6f760228.gif)

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

- `property`: Either a string defining the [property](#properties) to be set or an object defining key-value pairs to set multiple [properties](#properties) at once.
- `value`: If `property` is a string, `value` is the corresponding value. Otherwise, `value` is ignored.

#### `piling.arrangeBy(type, objective, options)`

Position piles with user-specified arrangement method.

`type`, `objective`, and `options` can be one of the following combinations:

| Type      | Objective                                                          | Options  |
| --------- | ------------------------------------------------------------------ | -------- |
| `null`    | `undefined` _(manual positioning)_                                 | `object` |
| `'index'` | a `string`, `object`, or `function`                                | `object` |
| `'ij'`    | a `string`, `object`, or `function`                                | `object` |
| `'xy'`    | a `string`, `object`, or `function`                                | `object` |
| `'uv'`    | a `string`, `object`, or `function`                                | `object` |
| `'data'`  | a `string`, `object`, `function`, or `array` of the previous types | `object` |

The following options are available for all types:

- `options.onPile` [type: `boolean` default: `false`]: If `true` applies the arrangement on every piling event.

**Notes and examples:**

- The signature of the callback function for types `index`, `ij`, `xy` and `uv` should be as follows:

  ```javascript
  function (pileState, pileId) {
    // Based on the `type` return the index, or the ij, xy, or uv coordinate
    return pilePosition;
  }
  ```

  Alternatively, one can specify a data property holding the pile position as follows:

  ```javascript
  piling.arrangeBy('index', 'myIndex');
  piling.arrangeBy('index', { property: 'myIndex', aggregator: 'median' });
  ```

  The `property` must correspond to a property of the item. The `aggregator` can be `min`, `max`, `mean`, `median`, `sum`, or a custom function with the following signature:

  ```javascript
  function (data) {
    // Do something with `data`
    // Based on the `type` the value must be a scalar or a tuple
    return aSingleValue;
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

#### `piling.groupBy(type, objective, options)`

Programmatically group items and piles based on the layout, spatial proximity, or data together.

`type`, `objective`, and `options` can be one of the following combinations:

| Type       | Objective                                                                               | Options  |
| ---------- | --------------------------------------------------------------------------------------- | -------- |
| `row`      | `left`, `center` (default), or `right`                                                  |          |
| `column`   | `top`, `center` (default), or `bottom`                                                  |          |
| `grid`     | `null` (default) or `{ columns, cellAspectRatio}`                                       |          |
| `overlap`  | Overlap threshold in square pixels. Default is `0`.                                     |          |
| `distance` | Distance threshold in pixels. Default is `0`.                                           |          |
| `category` | A `string`, `object`, `function`, or `array` of the previous types. See examples below. |          |
| `cluster`  | A `string`, `object`, `function`, or `array` of the previous types. See examples below. | `object` |

**Notes and examples:**

```javascript
piling.groupBy('row', 'left'); // Pile by row and align pile to the left most item/pile.

piling.groupBy('column', 'top'); // Pile by column and align pile to the top most item/pile.

piling.groupBy('grid'); // Pile by grid using the current layout
piling.groupBy('grid', { columns: 10, cellAspectRatio: 1.5 }); // Pile by grid using a grid of 10 columns with a cell aspect ratio of 1.5 (= width/height)

piling.groupBy('overlap'); // Pile all overlapping items/piles
piling.groupBy('overlap', 64); // Pile all items/piles that overlap by 64 or more square pixels

piling.groupBy('distance'); // Pile all items/piles that touch each other
piling.groupBy('distance', 64); // Pile all items/piles that are 64 or less pixels apart from each other

piling.groupBy('category', 'country'); // Pile all items/piles that have the same country value
piling.groupBy('category', item => item.country); // Same as before
piling.groupBy('category', {
  property: 'country',
  aggregator: countries => countries[0]
}); // Same as before but with a custom aggregator that simply picks the first country to define the category

piling.groupBy('cluster', 'x'); // Pile all that cluster together based on the `x` property
piling.groupBy('cluster', item => item.x); // Same as above
piling.groupBy('cluster', { property: 'x', aggregator: 'max' }); // Same as above but with a custom aggregator that picks the max `x` value
piling.groupBy('cluster', 'x', { clusterer: dbscan }); // Same as above but with a custom clusterer
piling.groupBy('cluster', 'x', { clustererOptions: { k: 2 } }); // Same as above but with customized clusterer options
```

#### `piling.destroy()`

Destroys the piling instance by disposing all event listeners, the pubSub instance, canvas, and the root PIXI container.

#### `piling.halt({ text, spinner = true })`

This will display a popup across the entire piling.js element to temporarily block all interactions. This is useful if you are doing some asynchronous job outside piling and want to prevent user interactions.

#### `piling.render()`

Render the root PIXI container.

#### `piling.resume()`

This will the halting popup.

#### `piling.splitAll()`

Scatter all the piles at the same time.

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

## Properties

| Name                        | Type                              | Default            | Constraints                                                                                     | Unsettable |
| --------------------------- | --------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------- | ---------- |
| darkMode                    | boolean                           | `false`            |                                                                                                 | `false`    |
| coverRenderer               | function                          |                    | see [`renderers`](#renderers)                                                                   | `true`     |
| backgroundColor             | string or int                     | `0x000000`         |                                                                                                 | `false`    |
| focusedPiles                | array                             | `[]`               | the id of current focused pile                                                                  | `true`     |
| coverAggregator             | function                          |                    | see [`aggregators`](#aggregators)                                                               | `true`     |
| depiledPile                 | array                             | `[]`               | the id of the pile to be depiled                                                                | `true`     |
| depileMethod                | string                            | originalPos        | `originalPos` or `closestPos`                                                                   | `true`     |
| easing                      | function                          | cubicInOut         | see [`notes`](#notes)                                                                           | `true`     |
| gridColor                   | string or int                     | `0x787878`         | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| gridOpacity                 | float                             | `1.0`              | must be in [`0`,`1`]                                                                            | `false`    |
| items                       | array                             | `[]`               | see [`data`](#data)                                                                             | `false`    |
| itemSize                    | int                               |                    | number of pixels                                                                                | `true`     |
| itemSizeRange               | array                             | `[0.7, 0.9]`       | array of two numbers between (0, 1)                                                             | `true`     |
| columns                     | int                               | `10`               | ignored when `itemSize` is defined                                                              | `false`    |
| rowHeight                   | int                               |                    |                                                                                                 | `true`     |
| cellAspectRatio             | float                             |                    | ignored when `rowHeight` is defined                                                             | `false`    |
| cellPadding                 | int                               |                    |                                                                                                 | `true`     |
| cellSize                    | int                               |                    | number of pixels                                                                                | `true`     |
| lassoFillColor              | string or int                     | `0xffffff`         | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| lassoFillOpacity            | float                             | `0.15`             | must be in [`0`,`1`]                                                                            | `false`    |
| lassoShowStartIndicator     | boolean                           | `true`             |                                                                                                 | `false`    |
| lassoStartIndicatorOpacity  | float                             | `0.1`              | must be in [`0`,`1`]                                                                            | `false`    |
| lassoStrokeColor            | string or int                     | `0xffffff`         | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| lassoStrokeOpacity          | float                             | `0.8`              | must be in [`0`,`1`]                                                                            | `false`    |
| lassoStrokeSize             | int                               | `1`                | must be greater or equal than `1`                                                               | `false`    |
| layout                      | object                            |                    | read-only                                                                                       | `false`    |
| orderer                     | function                          | row-major          | see [`notes`](#notes)                                                                           | `true`     |
| magnifiedPiles              | array                             | `[]`               | the id of current magnified pile                                                                | `true`     |
| navigationMode              | string                            | auto               | Can be one of auto, panZoom, or scroll                                                          | `false`    |
| pileBackgroundColor         | string, int or function           |                    | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| pileBackgroundOpacity       | float or function                 | `0`                | must be in [`0`,`1`]                                                                            | `false`    |
| pileBackgroundColorHover    | string, int or function           |                    | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| pileBackgroundOpacityHover  | float or function                 | `0.85`             | must be in [`0`,`1`]                                                                            | `false`    |
| pileBackgroundColorFocus    | string, int or function           |                    | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| pileBackgroundOpacityFocus  | float or function                 |                    | must be in [`0`,`1`]                                                                            | `false`    |
| pileBackgroundColorActive   | string, int or function           |                    | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| pileBackgroundOpacityActive | float or function                 |                    | must be in [`0`,`1`]                                                                            | `false`    |
| pileBorderColor             | string, int or function           | `0x808080`         | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| pileBorderOpacity           | float or function                 | `1.0`              | must be in [`0`,`1`]                                                                            | `false`    |
| pileBorderColorHover        | string, int or function           | `0x808080`         | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| pileBorderOpacityHover      | float or function                 | `1.0`              | must be in [`0`,`1`]                                                                            | `false`    |
| pileBorderColorFocus        | string, int or function           | `0xeee462`         | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| pileBorderOpacityFocus      | float or function                 | `1.0`              | must be in [`0`,`1`]                                                                            | `false`    |
| pileBorderColorActive       | string, int or function           | `0xffa5da`         | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| pileBorderOpacityActive     | float or function                 | `1.0`              | must be in [`0`,`1`]                                                                            | `false`    |
| pileBorderSize              | float or function                 | `0`                | see [`notes`](#notes)                                                                           | `true`     |
| pileCellAlignment           | string                            | topLeft            | `topLeft`, `topRight`, `bottomLeft`, `bottomRight` or `center`                                  | `true`     |
| pileContextMenuItems        | array                             | `[]`               | see _examples_ below                                                                            | `true`     |
| pileCoverInvert             | boolean or function               | `false`            | see _examples_ below                                                                            | `false`    |
| pileCoverScale              | float or function                 | `1.0`              | see _examples_ below                                                                            | `false`    |
| pileItemBrightness          | string, int or function           | `0`                | must be in [-1,1] where `-1` refers to black and `1` refers to white                            | `false`    |
| pileItemInvert              | boolean or function               | `false`            | can only be `true` or `false` where `true` refers inverted colors and `false` are normal colors | `false`    |
| pileItemOffset              | array or function                 | `[5, 5]`           | see [`notes`](#notes)                                                                           | `true`     |
| pileItemOpacity             | float or function                 | `1.0`              | see [`notes`](#notes)                                                                           | `true`     |
| pileItemRotation            | float or function                 | `0`                | see [`notes`](#notes)                                                                           | `true`     |
| pileItemTint                | string, int or function           | `0xffffff`         | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `true`     |
| pileLabel                   | string, array, function or object |                    | see [`notes`](#notes)                                                                           | `true`     |
| pileLabelAlign              | string or function                | `bottom`           | `bottom` or `top`                                                                               | `true`     |
| pileLabelColor              | array or function                 |                    | see [`notes`](#notes)                                                                           | `true`     |
| pileLabelFontSize           | int or function                   | 8                  |                                                                                                 | `true`     |
| pileLabelHeight             | float or function                 | 2                  |                                                                                                 | `true`     |
| pileLabelStackAlign         | string or function                | `horizontal`       | `horizontal` or `vertical`                                                                      | `true`     |
| pileLabelSizeTransform      | string or function                | `histogram`        | see [`notes`](#notes)                                                                           | `true`     |
| pileLabelText               | boolean or function               | `false`            | see [`notes`](#notes)                                                                           | `true`     |
| pileLabelTextMapping        | array or function                 |                    | see [`notes`](#notes)                                                                           | `true`     |
| pileLabelTextColor          | string or int                     | `0x000000`         | see [`notes`](#notes)                                                                           | `true`     |
| pileLabelTextOpacity        | float                             | `1`                | see [`notes`](#notes)                                                                           | `true`     |
| pileOpacity                 | float or function                 | `1.0`              | see [`notes`](#notes)                                                                           | `true`     |
| pileOrderItems              | function                          |                    | see [`notes`](#notes)                                                                           | `true`     |
| pileScale                   | float or function                 | `1.0`              | see [`notes`](#notes)                                                                           | `true`     |
| pileSizeBadge               | boolean or function               | `false`            | if `true` show the pile size as a badge                                                         | `true`     |
| pileSizeBadgeAlign          | array or function                 | `['top', 'right']` | if `true` show the pile size as a badge                                                         | `true`     |
| popupBackgroundOpacity      | float                             | `0.85`             | must be in [`0`,`1`]                                                                            | `false`    |
| previewAggregator           | function                          |                    | see [`aggregators`](#aggregators)                                                               | `true`     |
| previewBackgroundColor      | string, int or function           | `'inherit'`        | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| previewBackgroundOpacity    | float or function                 | `'inherit'`        | must be in [`0`,`1`]                                                                            | `false`    |
| previewBorderColor          | string, int or function           | `0xffffff`         | can be HEX, RGB, or RGBA string or hexadecimal value                                            | `false`    |
| previewBorderOpacity        | float or function                 | `0.85`             | must be in [`0`,`1`]                                                                            | `false`    |
| previewItemOffset           | function                          |                    | see [`notes`](#notes)                                                                           | `true`     |
| previewOffset               | number or function                | `2`                | see [`notes`](#notes)                                                                           | `false`    |
| previewPadding              | number or function                | `2`                | see [`notes`](#notes)                                                                           | `false`    |
| previewRenderer             | function                          |                    | see [`renderers`](#renderers)                                                                   | `true`     |
| previewScaling              | array or function                 | `[1,1]`            | the spacing between 1D previews                                                                 | `false`    |
| previewSpacing              | number or function                | `2`                | the spacing between 1D previews                                                                 | `true`     |
| renderer                    | function                          |                    | see [`renderers`](#renderers)                                                                   | `false`    |
| showGrid                    | boolean                           | `false`            |                                                                                                 | `false`    |
| tempDepileDirection         | string                            | horizontal         | horizontal or vertical                                                                          | `true`     |
| tempDepileOneDNum           | number                            | `6`                | the maximum number of items to be temporarily depiled in 1D layout                              | `true`     |
| temporaryDepiledPile        | array                             | `[]`               | the id of the pile to be temporarily depiled                                                    | `true`     |
| zoomScale                   | number or function                | `1`                | Allows adjusting the zoom-induced pile scale                                                    | `true`     |

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

- The following properties to define the _grid_: `cellSize`, `cellPadding`, `columns`, `rowHeight` and `cellAspectRatio`.

  One has to at least provide `columns` or `cellSize` to define a grid. If `cellSize` is defined `columns` are ignored. Similarly, when `rowHeight` is defined `cellAspectRatio` is ignored.

  When `cellSize` is defined, `cellSize` and `cellPadding` add up together to define the cell width. When `cellSize` is undefined, `cellSize` is defined by the derived cell width (given `columns`) minues `cellPadding`!

- `itemSize` defines the size of the items. If it's not defined, it should be derived from the cell size.

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

- If `pileBackgroundColor` is not defined, it will be set to the same color as the background depending on `darkMode`.

  `pileBackgroundColorActive`, `pileBackgroundColorFocus`, and `pileBackgroundColorHover` will inherit from `pileBackgroundColor` if not defined.

  `pileBackgroundOpacityFocus` and `pileBackgroundOpacityActive` will inherit from `pileBackgroundOpacityHover` if not defined.

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

- `pileBorderSize`, `pileCoverInvert`, `pileCoverScale`, `pileOpacity` and `pileScale` can be set to a static float value, or the user can specify a callback function to dynamically style piles. E.g.,

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

- `pileOrderItems` is used to sort the items on a pile before positioning the items. It should be set to a callback function which will receive the current [pile](#statepiles), and should return an array of sorted itemIDs. E.g.,

  ```javascript
  const pileOrderItems = pileState => pileState.items.sort((a, b) => a - b);

  piling.set('pileOrderItems', pileOrderItems);
  ```

  The signature of the callback function is as follows:

  ```javascript
    function (pileState) {
      // Sort itemIDs
      return arrayOfSortedIds;
    }
  ```

- `pileItemOffset` can be set to an array or a callback function. The array should be a tuple specifying the x and y offset in pixel. E.g.,

  ```javascript
  // Align items in y-axis
  piling.set('pileItemOffset', [0, 5]);
  ```

  See the next note for the signature of the callback function ⬇️

- `pileItemBrightness`, `pileItemInvert`, `pileItemOpacity`, `pileItemRotation` and `pileItemTint` can either be set to a static value or a callback function to dynamically style items. E.g.,

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

- `pileLabel` can be set to a `string`, `object`, `function`, or `array` of the previous types. E.g.,

  ```javascript
  piling.set('pileLabel', 'country');
  piling.set('pileLabel', itemState => itemState.country);
  piling.set('pileLabel', ['country', 'year']);
  piling.set('pileLabel', {
    property: item => item.country,
    aggregator: countries => countries[0]
  });
  ```

- `pileLabelColor` can be set to a HEX, RGB string or hexadecimal value, an `array` of the previous types, or a callback function. E.g.,

  ```javascript
  piling.set('pileLabelColor', '#e05aa9');
  piling.set('pileLabelColor', ['#e05aa9', '#e0722b', '#e0a638']);
  piling.set('pileLabelColor', (label, allLabels) => myOwnFancyColorMap[label]);
  ```

  The callback function receives the current label (`string`), and an array of all the labels, and it should return a HEX, RGB string or hexadecimal value. The signature is as follows:

  ```javascript
    function (label, allLabels) {
      // Pick the color for the `label`
      return color;
    }
  ```

- `pileLabelSizeTransform` is used to get a relative distribution of categories across a pile. It can be set to `'histogram'` or a callback function. E.g.,

  ```javascript
  // The following 2 examples are equivalent
  piling.set('pileLabelSizeTransform', 'histogram');
  piling.set('pileLabelSizeTransform', (counts, labels) => {
    // This function normalizes the counts to be in [0,1]
    const maxCount = Math.max(...counts);
    return counts.map(x => x / maxCount);
  });
  ```

  The callback function should receive an array of the sum of each label and return an array of scale factors that ranges in `[0, 1]`. The signature is as follows:

  ```javascript
    function (histogram) => {
      // Do stuff
      return arrayofScaleFactors;
    };
  ```

- `pileLabelTextMapping` can be set to an `array` of strings, or a callback function. E.g.,

  ```javascript
  piling.set('pileLabelTextMapping', ['red', 'blue', 'yellow', 'green']);
  piling.set(
    'pileLabelTextMapping',
    (label, allLabels) => `${abbreviation[label]}`
  );
  ```

  The callback function receives the current label (`string`), and an array of all the labels, and it should return a text string. The signature is as follows:

  ```javascript
    function (label, allLabels) {
      // Create text
      return text;
    }
  ```

- `pileSizeBadge` and `pileSizeBadgeAlign` allow to show the pile size as badge. Both can be defined dynamically using a pile-specific callback function. `pileSizeBadgeAlign` accepts an tuple of `[yAlign, xAlign]` where `yAlign` can be one of `top`, `center`, `bottom`, and `xAlign` can be one of `left`, `center`, `right`.

- `previewPadding` defines how much larger the preview items' background is sized. For example, a padding of `2` means that the background of a preview item is 1 pixel larger in eath direction (top, right, bottom, left).

- `previewItemOffset` is used to position the previews **individually** based on a per-preview item specific callback function. If it's not set, the preview will be positioned to the top of the cover by default. It should be set to a callback function which receives the current [preview item](#stateitems), the item's current index, and the [pile](#statepiles) that the item belongs to, and it should return a tuple of xy position of the preview. I.e., the function signature is as follows:

  ```javascript
  piling.set('previewItemOffset', (itemState, itemIndex, pileState) => {
    // Calculate the position
    return [x, y];
  });
  ```

- `previewOffset` and `previewSpacing` are used to **globally** position preview items. Hereby, `previewOffset` defines the offset in pixel to the pile cover and `previewSpacing` defines the combined spacing around a pile. E.g., `previewSpacing === 2` results in a 1px margin around the preview items. Both properties can be dynamically defines using a per-pile callback function as follows:

  ```javascript
  piling.set('previewOffset', pileState => {
    // Define the offset
    return offset;
  });
  ```

- `previewScaling` defines how much preview items are scaled according to the cover. Normally the previews' scale factor is identical to the cover's scale factor. Using this property the impact of this scale factor can be adjusted. The final x and y scale will then be determined as follows _xScale = 1 + (scaleFactor - 1) \* scaling[0]_. E.g., to not adjust the y scale to the cover but keep the x scale one can set `previewScaling = [1,0]`. The scaling can be determined dynamically using a per-pile callback function as follows:

  ```javascript
  piling.set('previewScaling', pileState => {
    // Define the x and y scaling
    return [xScaling, yScaling];
  });
  ```

- `zoomScale` allows to dynamically adjust the scale factor related to zooming. By default zooming **does not** affect the scale!

  ```javascript
  piling.set('zoomScale', cameraScale =>
    cameraScale >= 1 ? 1 + (cameraScale - 1) / 2 : 1 - (1 - cameraScale) / 2
  );
  ```

## Events

| Name             | Event Data              | Description                                                            |
| ---------------- | ----------------------- | ---------------------------------------------------------------------- |
| render           |                         | Published when the data has been rendered                              |
| update           | `{action}`              | Published when the redux store is updated                              |
| itemUpdate       |                         | Published after items updates and their consequences have been applied |
| pileEnter        | `{target, sourceEvent}` | Published when the mouse cursor enters a pile                          |
| pileLeave        | `{target, sourceEvent}` | Published when the mouse cursor leaves a pile                          |
| pileDragStart    | `{target, sourceEvent}` | Published when a pile drag is started                                  |
| pileDragMove     | `{target, sourceEvent}` | Published when a pile is dragged                                       |
| pileDragEnd      | `{target, sourceEvent}` | Published when a pile is dropped                                       |
| pilesFocus       | `{targets}`             | Published when piles are focused                                       |
| pilesBlur        | `{targets}`             | Published when piles are blurred                                       |
| pilesActive      | `{targets}`             | Published when piles are temporarily depiled                           |
| pilesInactive    | `{targets}`             | Published when temporarily depiled piles are closed                    |
| pilesPositionEnd | `{targets}`             | Published when piles positioning ended                                 |

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

# Clusterers

# Interactions

## Grouping

### Drag and Drop Grouping

1. Click and hold on a pile
2. Move the mouse onto another single pile
3. Release the mouse

<details><summary>See demo</summary>
<p>

![Drag and drop grouping](https://user-images.githubusercontent.com/932103/78094083-aa298c80-73a1-11ea-95c8-f436e70b2c9d.gif)

</p>
</details>

### Multi-select Grouping

1. Hold down <kbd>SHIFT</kbd>
2. Click on the piles you want to select
3. Click on a previously selected pile to group all selected piles onto this _target_ pile

   <details><summary>See demo</summary>
   <p>

   ![Multiselect grouping](https://user-images.githubusercontent.com/932103/78094274-27ed9800-73a2-11ea-9efe-3f9121337657.gif)

   </p>
   </details>

4. Alternatively, double click on a new pile to group all selected piles onto this _target_ pile

   <details><summary>See demo</summary>
   <p>

   ![Multiselect grouping with double-click](https://user-images.githubusercontent.com/932103/78094278-2a4ff200-73a2-11ea-846e-07ed69fc2625.gif)

   </p>
   </details>

### Lasso Grouping

1. Click on the background. A translucent circle will appear
2. Click and hold into the circle to activate the lasso.
3. Drag the cursor around the pile you want to group.
4. Release the mouse to trigger the grouping.

<details><summary>See demo</summary>
<p>

![Multiselect grouping with lasso](https://user-images.githubusercontent.com/932103/78094424-84e94e00-73a2-11ea-8958-55ba0c032b65.gif)

</p>
</details>

## Browsing

### Browsing in-place

1. Click on the pile you want to browse
2. Hover the mouse on the item's visible part to see the item

<details><summary>See demo</summary>
<p>

![Browsing in-place](https://user-images.githubusercontent.com/39853191/78209002-7604b780-74d8-11ea-9211-34503e424135.gif)

</p>
</details>

### Browsing via previews

1. Click on the pile you want to browse
2. Hover the mouse on one item's preview to see the item

<details><summary>See demo</summary>
<p>

![Browsing via previews](https://user-images.githubusercontent.com/39853191/78207017-03dda400-74d3-11ea-8078-ed1d891f93d5.gif)

</p>
</details>

### Browsing via temporarily de-pile

1. Double click on the pile to temporarily de-pile the pile
2. Double click again on the pile or on the background to close temporarily de-pile

   <details><summary>See demo</summary>
   <p>

   ![Browsing via temporarily de-pile](https://user-images.githubusercontent.com/39853191/78208161-42c12900-74d6-11ea-8ea9-01886a59b37f.gif)

   </p>
   </details>

3. Alternatively, right click on the pile to open the context menu
4. Click on <kbd>Temp. Depile</kbd> button to temporarily de-pile the pile
5. Right click on the pile again and click on <kbd>Close Temp. Depile</kbd> button to close temporarily de-pile

   <details><summary>See demo</summary>
   <p>

   ![Browsing via context menu - temp depile](https://user-images.githubusercontent.com/39853191/78208221-70a66d80-74d6-11ea-9969-971cb74f8e24.gif)

   </p>
   </details>

### Browsing separately

1. Right click on the pile to open the context menu
2. Click on <kbd>Browse Separately</kbd> button to browse the pile hierarchically
3. Click on the breadcrumb trail to go back to the previous level

<details><summary>See demo</summary>
<p>

![Browse separately](https://user-images.githubusercontent.com/39853191/78208546-38ebf580-74d7-11ea-9c82-57265446f015.gif)

</p>
</details>

## De-piling

1. Hold down <kbd>ALT</kbd>
2. Click on a pile to de-pile it

   <details><summary>See demo</summary>
   <p>

   ![Depile-alt](https://user-images.githubusercontent.com/39853191/78209508-ca5c6700-74d9-11ea-8604-bbdc4159f3c5.gif)

   </p>
   </details>

3. Alternatively, right click on the pile to open the context menu
4. Click on <kbd>Depile</kbd> button to de-pile

   <details><summary>See demo</summary>
   <p>

   ![Depile-context menu](https://user-images.githubusercontent.com/39853191/78209529-d6482900-74d9-11ea-8002-3b51eaeea30f.gif)

   </p>
   </details>

## Others

### Magnify a pile

1. Hold down <kbd>ALT</kbd>
2. Hover the mouse on a pile and scroll to manually magnify it
3. Click on the background to automatically unmagnify it

   <details><summary>See demo</summary>
   <p>

   ![Magnify by wheel](https://user-images.githubusercontent.com/39853191/78210748-b9adf000-74dd-11ea-87b8-29a96d5400fc.gif)

   </p>
   </details>

4. Alternatively, right click on the pile to open the context menu
5. Click on <kbd>Magnify</kbd> button to automatically magnify the pile
6. Right click on a magnified pile
7. Click on <kbd>Unmagnify</kbd> button to automatically unmagnify the pile

   <details><summary>See demo</summary>
   <p>

   ![Magnify by context menu](https://user-images.githubusercontent.com/39853191/78210759-c3375800-74dd-11ea-90ca-4a60564f8470.gif)

   </p>
   </details>

### Show grid

1. Right click on the background to open the context menu
2. Click on <kbd>Show Grid</kbd> button to show the grid
3. Right click on the background again and click on <kbd>Hide Grid</kbd> button to hide the grid

<details><summary>See demo</summary>
<p>

![Show grid](https://user-images.githubusercontent.com/39853191/78211167-cf6fe500-74de-11ea-99cc-f6f675d381bd.gif)

</p>
</details>

### Context menu

1. Right click will open the custormized context menu
2. While pressing <kbd>ALT</kbd>, right click will show the default context menu in the browser

<details><summary>See demo</summary>
<p>

![Context menu](https://user-images.githubusercontent.com/39853191/78211358-4e651d80-74df-11ea-83ec-db3298e2146f.gif)

</p>
</details>
