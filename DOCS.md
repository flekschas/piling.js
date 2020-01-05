# Documentation

- [Get started](#get-started)
  - [Examples](#examples)
    - [Image](#image)
    - [Matrix](#matrix)
  - [Data](#data)
- [Library API](#library-api)
  - [Constructors](#constructors)
  - [Methods](#methods)
  - [Events](#events)
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

First, import and instantiate a matrix renderer. If you want to have the aggregation and 1D previews of matrices when pile them up, you can also instantiate an aggregate renderer and a preview renderer here. (See [matrix renderer](#matrix-renderer) for more information.)

```javascript
import { createMatrixRenderer } from 'piling.js';

const matrixRenderer = createMatrixRenderer({ colorMap, shape: [3, 3] });
const aggregateRenderer = createMatrixRenderer({
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
piling.set('aggregateRenderer', aggregateRenderer);
piling.set('previewRenderer', previewRenderer);

piling.set('coverAggregator', matrixCoverAggregator);
piling.set('previewAggregator', matrixPreviewAggregator);

piling.set('items', [{ src: [1, 2, 3, 2, 3, 1, 3, 2, 1]}, ...]);
```

## Data

An array of objects with one required property `src`, and other optional user-defined properties:

- `src`: the item data. This can literally be anything. The only requirement
  is that the renderer understands how to render this data.

_Note, mixed data types are currently not supported._

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

# Library API

## Constructors

#### `const piling = createPilingJs(rootElement);`

**Returns:** a new piling instance.

**rootElement:** the div object which the canvas will be added on.

## Methods

#### `piling.get(property)`

**Returns:** one of the properties documented in [`set()`](#pilingsetproperty-value)

#### `piling.set(property, value)`

**Arguments:**

- `property`: Either a string defining the property to be set or an object defining key-value pairs to set multiple properties at once.
- `value`: If `property` is a string, `value` is the corresponding value. Otherwise, `value` is ignored.

The list of all understood properties is given below.

**Properties:**

| Name                      | Type             | Default               | Constraints                                                                   | Unsettable |
| ------------------------- | ---------------- | --------------------- | ----------------------------------------------------------------------------- | ---------- |
| aggregateRenderer         | function         |                       | see [`renderers`](#renderers)                                                 | `true`     |
| backgroundColor           | string or int    | `0x000000`            |                                                                               | `false`    |
| clickedPiles              | array            | `[]`                  | the id of current focused pile                                                | `true`     |
| coverAggregator           | function         |                       | see [`aggregators`](#aggregators)                                             | `true`     |
| depiledPile               | array            | `[]`                  | the id of the pile to be depiled                                              | `true`     |
| depileMethod              | string           | `originalPos`         | `originalPos` or `closestPos`                                                 | `true`     |
| easing                    | function         | cubicInOut            | see [`notes`](#notes)                                                         | `true`     |
| grid                      | array            | `[]`                  | see [`notes`](#notes)                                                         | `false`    |
| itemAlignment             | array or boolean | `['bottom', 'right']` | array of strings, including `top`, `left`, `bottom`, `right`, or just `false` | `true`     |
| itemRotated               | boolean          | `false`               | `true` or `false`                                                             | `true`     |
| items                     | array            | `[]`                  | see [`data`](#data)                                                           | `false`    |
| itemSizeRange             | array            | `[0.7, 0.9]`          | array of two numbers between (0, 1)                                           | `true`     |
| lassoFillColor            | string or int    | `0xffffff`            |                                                                               | `false`    |
| lassoFillOpacity          | float            | `0.15`                | must be in [`0`,`1`]                                                          | `false`    |
| lassoStrokeColor          | string or int    | `0xffffff`            |                                                                               | `false`    |
| lassoStrokeOpacity        | float            | `0.8`                 | must be in [`0`,`1`]                                                          | `false`    |
| lassoStrokeSize           | int              | `1`                   | must be greater or equal than `1`                                             | `false`    |
| orderer                   | function         | row-major             | see [`notes`](#notes)                                                         | `true`     |
| pileBorderColor           | string or int    | `0x808080`            |                                                                               | `false`    |
| pileBorderOpacity         | float            | `1.0`                 | must be in [`0`,`1`]                                                          | `false`    |
| pileBorderColorSelected   | string or int    | `0xeee462`            |                                                                               | `false`    |
| pileBorderOpacitySelected | float            | `1.0`                 | must be in [`0`,`1`]                                                          | `false`    |
| pileBorderColorActive     | string or int    | `0xffa5da`            |                                                                               | `false`    |
| pileBorderOpacityActive   | float            | `1.0`                 | must be in [`0`,`1`]                                                          | `false`    |
| pileBackgroundColor       | string or int    | `0x000000`            |                                                                               | `false`    |
| pileBackgroundOpacity     | float            | `1.0`                 | must be in [`0`,`1`]                                                          | `false`    |
| pileContextMenuItems      | array            | `[]`                  | see _examples_ below                                                          | `true`     |
| previewAggregator         | function         |                       | see [`aggregators`](#aggregators)                                             | `true`     |
| previewRenderer           | function         |                       | see [`renderers`](#renderers)                                                 | `true`     |
| previewSpacing            | number           | `2`                   | the spacing between 1D previews                                               | `true`     |
| renderer                  | function         |                       | see [`renderers`](#renderers)                                                 | `false`    |
| scaledPile                | array            | `[]`                  | the id of current scaled pile                                                 | `true`     |
| tempDepileDirection       | string           | `horizontal`          | `horizontal` or `vertical`                                                    | `true`     |
| tempDepileOneDNum         | number           | `6`                   | the maximum number of items to be temporarily depiled in 1D layout            | `true`     |
| temporaryDepiledPiles     | array            | `[]`                  | the id of the pile to be temporarily depiled                                  | `true`     |

**Examples and Notes:**

- To set a single property do:

  ```
  piling.set('propertyName', value);
  ```

  To set multiple values at once do:

  ```
  piling.set({
    propertyNameA: valueA,
    propertyNameB: valueB,
  });
  ```

- A property is considered unsettable if its value can be removed.
- `orderer` is the function for positioning piles, the default function is row-major orderer which looks like this:

  ```javascript
  // The default row-major order

  // A function that takes as input the number of columns and outputs
  // another function that takes in as input the position of a 1D ordering and
  // outputs the an array of `x` an `y` coordinates.

  const rowMajor = cols => index => [index % cols, Math.floor(index / cols)];
  ```

- `grid` is an array of numbers that defines a grid, the array can have at most 4 numbers in this particular order: `[num of columns, num of rows, height of a row, ratio of a cell]`, or at least 1 number: `[num of columns]`
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

#### `piling.destroy()`

Destroys the piling instance by disposing all event listeners, the pubSub instance, canvas, and the root PIXI container.

#### `piling.render()`

Render the root PIXI container.

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

# Renderers

A renderer should be a function that takes as input an array of the value of `src` property in your data that determining the source, and outputs promises which resolve to [Pixi Texture objects](http://pixijs.download/release/docs/PIXI.Texture.html).

## Predefined renderers

We provide 3 types of predefined renderers:

- `renderer`: render all the items.
- `aggregateRenderer`: render the aggregation of a pile.
- `previewRenderer`: render the preview of an item.

Currently we support rendering for [images](#image-renderer) and [matrices](#matrix-renderer). You can just import the factory function from our library.

### Image renderer

**Constructor:**

```javascript
import { createImageRenderer } from 'piling.js';
const imageRenderer = createImageRenderer();
```

**Src/Data:** currently our image renderer can render images from an URL or base64 encoding. I.e., the `src` property in your [data](#data) needs be URL pointing to an image or the base64 encoding of an image.

### SVG renderer

**Constructor:**

```javascript
import { createSvgRenderer } from 'piling.js';
const svgRenderer = createSvgRenderer(properties);
```

**Src/Data:** The SVG renderer can render SVG strings and SVG DOM elements.

**Properties** is an object of key-value pairs. The list of all understood properties is given below.

| Name       | Type   | Default | Constraints                     |
| ---------- | ------ | ------- | ------------------------------- |
| background | string |         | A valid CSS background property |

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

const rgbStr2rgba = (rgbStr, alpha = 1) => {
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
  .map((x, i) => rgbStr2rgba(interpolateRdPu(i / numColors)));

const matrixRenderer = createMatrixRenderer({ colorMap, shape: [16, 16] });
```

_Note:_

You can pass in different color map or shape to create `aggregateRender` for matrix aggregation and `previewRender` for matrix preview, so that the pile will have an aggregation of all the matrices on the pile cover, and matrix previews on top of the aggregation.

For example:

```javascript
const aggregateColorMap = new Array(numColors)
  .fill(0)
  .map((x, i) => rgbStr2rgba(interpolateOrRd((numColors - i) / numColors)));

const aggregateRenderer = createMatrixRenderer({
  colorMap: aggregateColorMap,
  shape: [16, 16]
});

const previewRenderer = createMatrixRenderer({ colorMap, shape: [16, 1] });
```

But to have aggregations and previews, you also need to have [aggregators](#aggregators) for them.

## Define your own renderer

If you want to define your own renderer to render your own data, you can do something as follows:

```javascript
// The actual renderer
const renderCustomTexture = (src, properties) => {
  // A complicated function that turns the src into a PIXI texture object
  return PIXI.Texture.from(...);
}

// Factory function
const createCustomRenderer = properties => sources => {
  Promise.all(
    sources.map(src => {
      return new Promise((resolve, reject) => {
        const texture = renderCustomTexture(src, properties);

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
piling.set('aggregateRenderer', aggregateRenderer);

// for the item preview
piling.set('previewRenderer', previewRenderer);
```

# Aggregators

Aggregators are used for aggregation of piles and items.

An aggregator should be a function that takes as input an array of the value of `src` property in your data that determining the source, and output promises which resolve to an array of aggregated source value that can be passed to the [renderers](#renderers).

## Predefined aggregators

We currently provide predefined aggregators for [matrices](#matrix-cover-aggregator) and [matrix previews](#matrix-preview-aggregator). You can just import the factory function from our library.

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

## Define your own aggregator

If you want to define your own aggregator, you can do something as follows:

```javascript
// The actual aggregator
const customAggregateSource = (src, aggregator) => {
  // A function that calculate the aggregation of src
  return aggregatedSrc;
};

// Factory function
const createCustomAggregator = aggregagtor => sources => {
  Promise.all(
    sources.map(src => {
      return new Promise((resolve, reject) => {
        const aggregatedSrc = customAggregateSource(src, aggregator);

        if (!aggregatedSrc) reject(new Error('Aggregation failed'));

        resolve(aggregatedSrc);
      });
    })
  );
};
```

## Add aggregators to piling.js library

Call [set](#pilingsetproperty-value) method to add aggregators to the library.

```javascript
piling.set('coverAggregator', coverAggregator);
piling.set('previewAggregator', previewAggregator);
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
- **Scale a pile:**
  - While pressing <kbd>ALT</kbd>, click on a pile to automatically scale it up.
  - While pressing <kbd>ALT</kbd>, click on a scaled-up pile to automatically scale it down.
  - While pressing <kbd>ALT</kbd>, hover on a pile and scroll to manually scale it. Then click on the background to automatically scale it down.
  - Right click on a pile to open the context menu. Click on <kbd>scale up</kbd> button to automatically scale the pile up.
  - Right click on a scaled-up pile to open the context menu. Click on <kbd>scale donw</kbd> button to automatically scale the pile down.
- **Show grid:**
  - Right click on the background to open the context menu. Click on <kbd>show grid</kbd> button to show the grid.
  - If the grid is shown, right click on the background and click on <kbd>hide grid</kbd> button to hide the grid.
- **Context menu:**
  - Right click will open the custormized context menu.
  - While pressing <kbd>ALT</kbd>, right click will show the default context menu in the browser.
