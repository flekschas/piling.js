# API

- [Getting started](#getting-started)
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

## Getting started

### Examples

#### Image

#### Matrix

### Data

An array of dictionaries (objects) with one essential property `src`, and other user defined properties:

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
  src: [[3, 2, 1], [2, 3, 2], [1, 2, 3]],
  shape: [3, 3],
  dataType: float32
}
```

## Library

### Constructors

#### `const pileJs = createPileJs(rootElement);`

**Returns:** a new pile.js instance.

**rootElement:** the div object which the canvas will be added on.

#### `const matrixRenderer = createMatrixRenderer(properties);`

**Returns:** a new matrix renderer instance.

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
import createMatrixRenderer from '../src/matrix-renderer';

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

**Returns:** a new matrix cover aggregator instance.

**Aggregator:** the method of aggregation, could be `'mean'`, `'variance'`, `'std'`. The default value is `'mean'`.

#### `const matrixPreviewAggregator = createMatrixPreviewAggregator(aggregator);`

**Returns:** a new matrix preview aggregator instance.

**Aggregator:** the method of aggregation, could be `'mean'`, `'variance'`, `'std'`. The default value is `'mean'`.

## Methods

#### `pileJs.get(property)`

**Returns:** one of the properties documented in [`set()`](#pileJssetproperty-value)

#### `pileJs.set(property, value)`

**Arguments:** a pair of `property` and `value` is a key-value pair. The list of all understood properties is given below.

**Properties:**

| Name                     | Type     | Default               | Constraints  | Nullifiable |
| ------------------------ | -------- | --------------------- | ------------ | ----------- |
| `'renderer'`             | function |   | see [`renderer`](#renderer)  | `false`     |
| `'previewRenderer'`      | function |   | see [`renderer`](#renderer)  | `true`      |
| `'aggregateRenderer'`    | function |   | see [`renderer`](#renderer)  | `true`      |
| `'coverAggregator'`      | function |   | see [`cover aggregator`](#const-matrixCoverAggregator--createMatrixCoverAggregatoraggregator)       | `true`      |
| `'previewAggregator'`    | function |   | see [`preview aggregator`](#const-matrixPreviewAggregator--createMatrixPreviewAggregatoraggregator) | `true`      |
| `'items'`                | array    | `[]`                  | see [`data`](#data) | `false`     |
| `'orderer'`              | function | row-major             | see [`notes`](#notes) | `true`      |
| `'grid'`                 | array    | `[]`                  | see [`notes`](#notes) | `false`     |
| `'itemSizeRange'`        | array    | `[0.5, 0.9]`          | array of two numbers between (0, 1)     | `true`      |
| `'itemAlignment'`        | array or boolean    | `['bottom', 'right']` | array of strings, including `'top'`, `'left'`, `'bottom'`, `'right'`, or just `false`            | `true`      |
| `'itemRotated'`          | boolean  | `false`               | `true` or `false`   | `true`      |
| `'clickedPile'`          | array    | `[]`   | the id of current focused pile          | `true`     |
| `'scaledPile'`           | array    | `[]`   | the id of current scaled pile           | `true`     |
| `'depiledPile'`          | array    | `[]`   | the id of the pile to be depiled        | `true`     |
| `'depileMethod'`         | string   | `'originalPos'`       | `'originalPos'` or `'closestPos'`       | `true`     |
| `'temporaryDepiledPile'` | array    | `[]`                  | the id of the pile to be temporarily depiled                | `true`     |
| `'tempDepileDirection'`  | string   | `'horizontal'`        | `'horizontal'` or `'vertical'`          | `true`     |
| `'tempDepileOneDNum'`    | number   | `6`                   | the maximum number of items to be temporarily depiled in 1D layout              | `true`     |
| `'easingFunc'`           | function | cubicInOut            | see [`notes`](#notes)                   | `true`      |
| `'previewSpacing'`       | number   | `0.5`                 | the spacing between 1D previews         | `true`     |

#### Notes

- A property is considered nullifiable if it can be unset.
- `orderer` is the function for positioning piles, the default function is row-major orderer which looks like this:
```javascript
// The default row-major order

// A function that takes as input the number of columns and outputs
// another function that takes in as input the position of a 1D ordering and
// outputs the an array of `x` an `y` coordinates.

const rowMajor = cols => index => [
  index % cols,
  Math.floor(index / cols)
];
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

Destroys the pile-me instance by disposing all event listeners, the pubSub instance, canvas, and the root PIXI container.

#### `pileJs.render()`

Render the root PIXI container with request animation frame.

#### `pileJs.subscribe(eventName, eventHandler)`

Subscribe to an event.
`eventName` needs to be one of these [events](#events).
`eventHandler` is a callback function which looks like this:
```javascript
const eventHandler = (eventData) => { 
  // handle event here
}
```

#### `pileJs.unsubscribe(eventName, eventHandler)`

Unsubscribe from an event. See [events](#events) for all the events.

### Events
 
 | Name         | Event Data       | Description                          | 
 |--------------|------------------|--------------------------------------|
 | `'dropPile'` | `{pileId}`       | Published when drop a pile           |
 | `'dragPile'` | `{pileId}`       | Published when start dragging a pile |
 | `'highlightPile'` | `{pileId}`  | Published while dragging a pile      |

## Renderers

### Predefined renderers

#### Image renderer

#### Matrix renderer

### Define your own renderer

A renderer should be a function that takes as input an array of the value of `src` property in your data that determining the source and outputs promises which resolve to Pixi Texture objects.

```javascript
// An example
const renderer = sources => {
  Promise.all(
    sources.map(src => {
      return new Promise((resolve, reject) => {
        // generate texture here
          .then(texture => {
            resolve(PIXI.Texture.from(texture))
          })
          .catch(error => {
            reject(error);
          });
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
