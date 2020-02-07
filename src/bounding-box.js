import { pipe, withStaticProperty } from '@flekschas/utils';

const createBBox = (metadata = {}) => ({ minX, minY, maxX, maxY }) =>
  pipe(
    withStaticProperty('minX', minX),
    withStaticProperty('minY', minY),
    withStaticProperty('maxX', maxX),
    withStaticProperty('maxY', maxY),
    withStaticProperty('width', maxX - minX),
    withStaticProperty('height', maxY - minY),
    withStaticProperty('cX', minX + (maxX - minX) / 2),
    withStaticProperty('cY', minY + (maxY - minY) / 2),
    ...Object.entries(metadata).map(([key, value]) =>
      withStaticProperty(key, value)
    )
  )({});

export default createBBox;
