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
