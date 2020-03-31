import { isFunction } from '@flekschas/utils';

const getPileProp = (property, pileState) =>
  isFunction(property) ? property(pileState) : property;

export default getPileProp;
