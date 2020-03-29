import { isFunction } from '@tensorflow/tfjs-core/dist/util';

const getPileProp = (property, pileState) =>
  isFunction(property) ? property(pileState) : property;

export default getPileProp;
