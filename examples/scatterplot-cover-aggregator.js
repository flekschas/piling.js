import { identity } from '@flekschas/utils';

const createScatterplotCoverAggregator = () => sources =>
  Promise.resolve(sources.flatMap(identity));

export default createScatterplotCoverAggregator;
