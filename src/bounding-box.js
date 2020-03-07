import { pipe, withStaticProperty } from '@flekschas/utils';

const createBBox = (metadata = {}) => ({
  minX = 0,
  minY = 0,
  maxX = 1,
  maxY = 1,
  ...extra
} = {}) =>
  pipe(
    withStaticProperty('minX', minX),
    withStaticProperty('minY', minY),
    withStaticProperty('maxX', maxX),
    withStaticProperty('maxY', maxY),
    withStaticProperty('width', maxX - minX),
    withStaticProperty('height', maxY - minY),
    withStaticProperty('cX', minX + (maxX - minX) / 2),
    withStaticProperty('cY', minY + (maxY - minY) / 2),
    ...Object.entries({ ...metadata, ...extra }).map(([key, value]) =>
      withStaticProperty(key, value)
    )
  )({});

export default createBBox;
