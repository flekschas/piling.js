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
