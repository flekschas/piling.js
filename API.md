# API

- [Get started](#get-started)
  - [Examples](#examples)
    - [Image](#image)
    - [Matrix](#matrix)
  - [Data](#data)
- [Library](#library)
  - [Constructors](#constructors)
  - [Methods](#methods)
  - [Events](#events)
- [Renderers](#renderers)
  - [Predefined renderers](#predefined-renderers)
    - [Image renderer](#image-renderer)
    - [Matrix renderer](#matrix-renderer)
  - [Define your own renderer](#define-your-own-renderer)
- [Aggregators](#aggregators)
  - [Predefined aggregators](#predefined-aggregators)
    - [Matrix cover aggregator](#matrix-cover-aggregator)
    - [Matrix preview aggregator](#matrix-preview-aggregator)
  - [Define your own aggregator](#define-your-own-aggregator)
- [Interactions](#interactions)

## Get started

### Examples

As a first step for all examples you have to import and instantiate pile.js as follows. The only argument is the dom element you want to render pile.js into.

```javascript
import createPileJs from 'pile.js';
const pileJs = createPileMe(document.getElementById('demo'));
```

#### Image

First, import and instantiate an [image renderer](#image-renderer) and add it to our pileJs library. Then, add images to the library.

```javascript
import { createImageRenderer } from 'pile.js';

pileJs.set('renderer', createImageRenderer());
pileJs.set('items', [{ src: 'http://example.com/my-fancy-photo.png' }, ...]);
```

#### Matrix

First, import and instantiate the renderers and aggregators. See [matrix renderer](#matrix-renderer) and [aggregators](#aggregators) for more information.

```javascript
import { createMatrixRenderer } from 'pile.js';
import {
  createMatrixCoverAggregator,
  createMatrixPreviewAggregator
} from 'pile.js';

const matrixRenderer = createMatrixRenderer({ colorMap, shape: [3, 3] });
const previewRenderer = createMatrixRenderer({ colorMap, shape: [3, 1] });
const matrixCoverAggregator = createMatrixCoverAggregator('mean');
const matrixPreviewAggregator = createMatrixPreviewAggregator('mean');
```

Then add the renderers and aggregators to our pileJs library. Finally add the matrix data to the library.

```javascript
pileJs.set('renderer', matrixRenderer);
pileJs.set('aggregateRenderer', matrixRenderer);
pileJs.set('previewRenderer', previewRenderer);

pileJs.set('coverAggregator', matrixCoverAggregator);
pileJs.set('previewAggregator', matrixPreviewAggregator);

pileJs.set('items', [{ src: [1, 2, 3, 2, 3, 1, 3, 2, 1]}, ...]);
```

### Data

An array of objects with one required property `src`, and other optional user-defined properties:

- `src`: the item data. this can be a URL or data object. the only requirement
  is that the renderer understands this object.

_Note, mixed data types are currently not supported._

```javascript
// External image data
{
  id: 001,
  src: 'https://github.com/test.png'
}

// Matrix data
{
  src: [3, 2, 1, 2, 3, 2, 1, 2, 3],
  shape: [3, 3],
  dataType: float32
}
```

## Library

### Constructors

#### `const pileJs = createPileJs(rootElement);`

**Returns:** a new pileJs instance.

**rootElement:** the div object which the canvas will be added on.

#### `const imageRenderer = createImageRenderer();`

**Renturns:** a new image renderer.

#### `const matrixRenderer = createMatrixRenderer(properties);`

**Returns:** a new matrix renderer.

**Arguments:** `properties` is an object of key-value pairs. The list of all understood properties is given below.

**Properties:**

| Name     | Type   | Default | Constraints   |
| -------- | ------ | ------- | ------------- |
| colorMap | array  |         | Array of rgba |
| shape    | array  |         | Matrix shape  |
| minValue | number | `0`     |               |
| maxValue | number | `1`     |               |

**Notes:**

- `shape` describes the size of matrix, e.g., for a 4 ✖ 5 matrix, `shape` should be `[4, 5]`

**Examples:**

```javascript
import { interpolateRdPu } from 'd3-scale-chromatic';
import createMatrixRenderer from 'pile.js';

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
  .map((x, i) => rgbStr2rgba(interpolateRdPu((numColors - i) / numColors)));
colorMap[0] = [0, 0, 0, 0];

const matrixRenderer = createMatrixRenderer({ colorMap, shape: [16, 16] });
```

#### `const matrixCoverAggregator = createMatrixCoverAggregator(aggregator);`

**Returns:** a new matrix cover aggregator.

**Aggregator:** the method of aggregation, could be `'mean'`, `'variance'`, `'std'`. The default value is `'mean'`.

#### `const matrixPreviewAggregator = createMatrixPreviewAggregator(aggregator);`

**Returns:** a new matrix preview aggregator.

**Aggregator:** the method of aggregation, could be `'mean'`, `'variance'`, `'std'`. The default value is `'mean'`.

## Methods

#### `pileJs.get(property)`

**Returns:** one of the properties documented in [`set()`](#pileJssetproperty-value)

#### `pileJs.set(property, value)`

**Arguments:** a pair of `property` and `value` is a key-value pair. The list of all understood properties is given below.

**Properties:**

| Name                     | Type             | Default               | Constraints                                                                                         | Nullifiable |
| ------------------------ | ---------------- | --------------------- | --------------------------------------------------------------------------------------------------- | ----------- |
| `'renderer'`             | function         |                       | see [`renderer`](#renderer)                                                                         | `false`     |
| `'previewRenderer'`      | function         |                       | see [`renderer`](#renderer)                                                                         | `true`      |
| `'aggregateRenderer'`    | function         |                       | see [`renderer`](#renderer)                                                                         | `true`      |
| `'coverAggregator'`      | function         |                       | see [`cover aggregator`](#const-matrixCoverAggregator--createMatrixCoverAggregatoraggregator)       | `true`      |
| `'previewAggregator'`    | function         |                       | see [`preview aggregator`](#const-matrixPreviewAggregator--createMatrixPreviewAggregatoraggregator) | `true`      |
| `'items'`                | array            | `[]`                  | see [`data`](#data)                                                                                 | `false`     |
| `'orderer'`              | function         | row-major             | see [`notes`](#notes)                                                                               | `true`      |
| `'grid'`                 | array            | `[]`                  | see [`notes`](#notes)                                                                               | `false`     |
| `'itemSizeRange'`        | array            | `[0.7, 0.9]`          | array of two numbers between (0, 1)                                                                 | `true`      |
| `'itemAlignment'`        | array or boolean | `['bottom', 'right']` | array of strings, including `'top'`, `'left'`, `'bottom'`, `'right'`, or just `false`               | `true`      |
| `'itemRotated'`          | boolean          | `false`               | `true` or `false`                                                                                   | `true`      |
| `'clickedPile'`          | array            | `[]`                  | the id of current focused pile                                                                      | `true`      |
| `'scaledPile'`           | array            | `[]`                  | the id of current scaled pile                                                                       | `true`      |
| `'depiledPile'`          | array            | `[]`                  | the id of the pile to be depiled                                                                    | `true`      |
| `'depileMethod'`         | string           | `'originalPos'`       | `'originalPos'` or `'closestPos'`                                                                   | `true`      |
| `'temporaryDepiledPile'` | array            | `[]`                  | the id of the pile to be temporarily depiled                                                        | `true`      |
| `'tempDepileDirection'`  | string           | `'horizontal'`        | `'horizontal'` or `'vertical'`                                                                      | `true`      |
| `'tempDepileOneDNum'`    | number           | `6`                   | the maximum number of items to be temporarily depiled in 1D layout                                  | `true`      |
| `'easingFunc'`           | function         | cubicInOut            | see [`notes`](#notes)                                                                               | `true`      |
| `'previewSpacing'`       | number           | `2`                   | the spacing between 1D previews                                                                     | `true`      |

#### Notes

- A property is considered nullifiable if it can be unset.
- `orderer` is the function for positioning piles, the default function is row-major orderer which looks like this:

```javascript
// The default row-major order

// A function that takes as input the number of columns and outputs
// another function that takes in as input the position of a 1D ordering and
// outputs the an array of `x` an `y` coordinates.

const rowMajor = cols => index => [index % cols, Math.floor(index / cols)];
```

- `grid` is an array of numbers that defines a grid, the array can have at most 4 numbers in this particular order: `[num of columns, num of rows, height of a row, ratio of a cell]`, or at least 1 number: `[num of columns]`
- `easingFunc` is the easing function for animation, the default function is `cubicInOut` which looks like this:

```javascript
const cubicInOut = t => {
  t *= 2;
  const p = (t <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
  return p;
};
```

#### `pileJs.destroy()`

Destroys the pileJs instance by disposing all event listeners, the pubSub instance, canvas, and the root PIXI container.

#### `pileJs.render()`

Render the root PIXI container with request animation frame.

#### `pileJs.subscribe(eventName, eventHandler)`

Subscribe to an event.
`eventName` needs to be one of these [events](#events).
`eventHandler` is a callback function which looks like this:

```javascript
const eventHandler = eventData => {
  // handle event here
};
```

#### `pileJs.unsubscribe(eventName, eventHandler)`

Unsubscribe from an event. See [events](#events) for all the events.

### Events

| Name              | Event Data | Description                          |
| ----------------- | ---------- | ------------------------------------ |
| `'dropPile'`      | `{pileId}` | Published when drop a pile           |
| `'dragPile'`      | `{pileId}` | Published when start dragging a pile |
| `'highlightPile'` | `{pileId}` | Published while dragging a pile      |

## Renderers

A renderer should be a function that takes as input an array of the value of `src` property in your data that determining the source, and outputs promises which resolve to **Pixi Texture objects**.

### Predefined renderers

We currently provide predefined renderers of images and matrices. You can just import the facture function from our library.

#### Image renderer

##### Constructor:

```javascript
const imageRenderer = createImageRenderer();
```

##### Add to pileJs library:

```javascript
pileJs.set('renderer', imageRenderer);
```

**Note:** currently our image renderer can only render from image URL, which means the `src` property in your [data](#data) need to be a string of the image URL.

#### Matrix renderer

##### Constructor:

```javascript
const matrixRenderer = createMatrixRenderer(properties);
```

**`Properties`** is an object of key-value pairs. The list of all understood properties is given below.

| Name     | Type   | Default | Constraints   |
| -------- | ------ | ------- | ------------- |
| colorMap | array  |         | Array of rgba |
| shape    | array  |         | Matrix shape  |
| minValue | number | `0`     |               |
| maxValue | number | `1`     |               |

**Note:**

- `shape` describes the size of matrix, e.g., for a 4 ✖ 5 matrix, `shape` should be `[4, 5]`

**Examples:**

```javascript
import { interpolateRdPu } from 'd3-scale-chromatic';
import createMatrixRenderer from 'pile.js';

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

**Note:**

You can pass in different color map or shape to create different matrix renderers for matrix aggregation and matrix preview, so that the pile will have an aggregation of all the matrices on the pile cover, and matrix previews on top of the aggregation. 

But to have aggregations and previews, you also need to have [aggregators](#aggregators) for them.

##### Add to pileJs library:

```javascript
// for all the matrices
pileJs.set('renderer', matrixRenderer);
// for the aggregation of a pile
pileJs.set('aggregateRenderer', matrixRenderer);
// for the matrix preview
pileJs.set('previewRenderer', previewRenderer);
```

### Define your own renderer

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
    });
  )
};
```

## Aggregators

### Predefined aggregators

#### Matrix cover aggregator

#### Matrix preview aggregator

### Define your own aggregator

## Interactions

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
