import { isArray } from '@flekschas/utils';

import { ALIGNMENTS_X, ALIGNMENTS_Y } from '../defaults';

const toAlignment = (alignment) => {
  const validAlignment = ['top', 'left'];
  const xAlign = isArray(alignment) ? alignment[1] : alignment;
  const yAlign = isArray(alignment) ? alignment[0] : alignment;

  if (ALIGNMENTS_Y.indexOf(yAlign) >= 0) {
    validAlignment[0] = yAlign;
  }

  if (ALIGNMENTS_X.indexOf(xAlign) >= 0) {
    validAlignment[1] = xAlign;
  }

  return validAlignment;
};

export default toAlignment;
