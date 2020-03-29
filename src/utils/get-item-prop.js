import { isFunction } from '@tensorflow/tfjs-core/dist/util';

const getItemProp = (property, itemState, itemIndex = 0) =>
  isFunction(property)
    ? property(itemState, itemState.id, itemIndex)
    : property;

export default getItemProp;
