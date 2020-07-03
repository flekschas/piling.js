import { pipe, withConstructor, withStaticProperty } from '@flekschas/utils';

const createBBox = (metadata = {}) => ({
  x = 0,
  y = 0,
  width = 1,
  height = 1,
  ...extra
} = {}) =>
  pipe(
    withConstructor(createBBox),
    withStaticProperty('x', x),
    withStaticProperty('y', y),
    withStaticProperty('minX', x),
    withStaticProperty('minY', y),
    withStaticProperty('maxX', x + width),
    withStaticProperty('maxY', y + width),
    withStaticProperty('cX', x + width / 2),
    withStaticProperty('cY', x + height / 2),
    withStaticProperty('width', width),
    withStaticProperty('height', height),
    ...Object.entries({ ...metadata, ...extra }).map(([key, value]) =>
      withStaticProperty(key, value)
    )
  )({});

export default createBBox;
