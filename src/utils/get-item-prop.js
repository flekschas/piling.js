import { isFunction } from '@flekschas/utils';

const getItemProp = (property, itemState, itemIndex = 0) =>
  isFunction(property)
    ? property(itemState, itemState.id, itemIndex)
    : property;

export default getItemProp;
