import { isObject } from '@flekschas/utils';

const isNdarray = (a) =>
  isObject(a) &&
  a.data &&
  (a.data.constructor === Float32Array || a.data.constructor === Uint8Array) &&
  a.shape;

export default isNdarray;
