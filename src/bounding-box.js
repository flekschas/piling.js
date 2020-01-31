import { pipe, withReadOnlyProperty } from '@flekschas/utils';

const createBBox = (metadata = {}) => ({ minX, minY, maxX, maxY }) =>
  pipe(
    withReadOnlyProperty('minX', minX),
    withReadOnlyProperty('minY', minY),
    withReadOnlyProperty('maxX', maxX),
    withReadOnlyProperty('maxY', maxY),
    withReadOnlyProperty('width', maxX - minX),
    withReadOnlyProperty('height', maxY - minY),
    withReadOnlyProperty('cX', minX + (maxX - minX) / 2),
    withReadOnlyProperty('cY', minY + (maxY - minY) / 2),
    ...Object.entries(metadata).map(([key, value]) =>
      withReadOnlyProperty(key, value)
    )
  )({});

export default createBBox;
