# API

## Data

An array of dictionaries (objects) with two essential properties:

- `id`: the item identifier (has to be unique)
- `src`: the item data. this can be a URL or data object. the only requirement
  is that the renderer understands this object.

_Note, mixed data types are currently not supported._

```
// External image data
{
  id: 001,
  src: 'https://github.com/test.png'
}

// Matrix data
{
  id: 001,
  src: [[3, 2, 1], [2, 3, 2], [1, 2, 3]]
}
```

## Renderer

A function that takes as input a `src` property determining the source and
outputs a promise which resolves to a rendered Pixi Sprite object.

```
// A very simple image renderer
const imageRenderer = image =>  new PIXI.Sprite(PIXI.Texture.from(image));
```

## Orderer

A function that takes as input the number of columns and outputs
another function that takes in as input the position of a 1D ordering and
outputs the an array of `x` an `y` coordinates.

```
// The default row-major order
const rowMajor = cols => index => [
  index % cols,
  Math.floor(index / cols)
];
```

## Constructors

#### `const pileMe = createPileMe(rootElement);`

**Returns:** a new pile-me instance.

**rootElement:** the div object which the canvas will be added on.

#### `const matrixRenderer = createMatrixRenderer(properties);`

**Returns:** a new matrix renderer instance.

**Arguments:** `properties` is an object of key-value pairs. The list of all understood properties is given below.

**Properties:**

| Name     | Type   | Default | Constraints   | Settable | Nullifiable |
| -------- | ------ | ------- | ------------- | -------- | ----------- |
| colorMap | array  |         | Array of rgba | `true`   | `false`     |
| shape    | array  |         | Matrix shape  | `true`   | `false`     |
| minValue | number | `0`     |               | `true`   | `false`     |
| maxValue | number | `1`     |               | `true`   | `false`     |

**Examples:**

```
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

## Method

#### `pileMe.get(property)`

**Returns:** one of the properties documented in [`set()`](#pilemesetproperty-value)

#### `pileMe.set(property, value)`

**Arguments:** a pair of `property` and `value` is a key-value pair. The list of all understood properties is given below.

**Properties:**

| Name                     | Type     | Default               | Constraints                                                                                         | Settable | Nullifiable |
| ------------------------ | -------- | --------------------- | --------------------------------------------------------------------------------------------------- | -------- | ----------- |
| `'renderer'`             | function |                       | see [`renderer`](#renderer)                                                                         | `true`   | `false`     |
| `'previewRenderer'`      | function |                       | see [`renderer`](#renderer)                                                                         | `true`   | `true`      |
| `'aggregateRenderer'`    | function |                       | see [`renderer`](#renderer)                                                                         | `true`   | `true`      |
| `'coverAggregator'`      | function |                       | see [`cover aggregator`](#const-matrixCoverAggregator--createMatrixCoverAggregatoraggregator)       | `true`   | `true`      |
| `'previewAggregator'`    | function |                       | see [`preview aggregator`](#const-matrixPreviewAggregator--createMatrixPreviewAggregatoraggregator) | `true`   | `true`      |
| `'items'`                | array    | `[]`                  | see [`data`](#data)                                                                                 | `true`   | `false`     |
| `'orderer'`              | function | row-major             | see [`orderer`](#orderer)                                                                           | `true`   | `true`      |
| `'grid'`                 | array    | `[]`                  | see [`notes`](#notes)                                                                               | `true`   | `false`     |
| `'itemSizeRange'`        | array    | `[0.5, 0.9]`          | array of two numbers between (0, 1)                                                                 | `true`   | `true`      |
| `'itemAlignment'`        | array    | `['bottom', 'right']` | array of strings, including `'top'`, `'left'`, `'bottom'`, `'right'`                                | `true`   | `true`      |
| `'itemRotated'`          | boolean  | `false`               | `true` or `false`                                                                                   | `true`   | `true`      |
| `'clickedPile'`          | array    | `[]`                  | the id of current focused pile                                                                      | `true`   | `false`     |
| `'scaledPile'`           | array    | `[]`                  | the id of current scaled pile                                                                       | `true`   | `false`     |
| `'depiledPile'`          | array    | `[]`                  | the id of the pile to be depiled                                                                    | `true`   | `false`     |
| `'depileMethod'`         | string   | `'originalPos'`       | `'originalPos'` or `'closestPos'`                                                                   | `true`   | `false`     |
| `'temporaryDepiledPile'` | array    | `[]`                  | the id of the pile to be temporarily depiled                                                        | `true`   | `false`     |
| `'tempDepileDirection'`  | string   | `'horizontal'`        | `'horizontal'` or `'vertical'`                                                                      | `true`   | `false`     |
| `'tempDepileOneDNum'`    | number   | `6`                   | the maximum number of items to be temporarily depiled in 1D layout                                  | `true`   | `false`     |
| `'easingFunc'`           | function | cubicInOut            | see [`notes`](#notes)                                                                               | `true`   | `true`      |
| `'previewSpacing'`       | number   | `0.5`                 | the spacing between 1D previews                                                                     | `true`   | `false`     |

#### Notes

#### `pileMe.destroy()`

Destroys the pile-me instance by disposing all event listeners, the pubSub instance, canvas, and the root PIXI container.

#### `pileMe.render()`

Render the root PIXI container with request animation frame.

#### `pileMe.subscribe(eventName, eventHandler)`

Subscribe to an event.

#### `pileMe.unsubscribe(eventName, eventHandler)`

Unsubscribe from an event.
