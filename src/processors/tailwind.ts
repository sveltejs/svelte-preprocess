import { transformMarkup } from '../modules/markup';

import type { PreprocessorGroup } from '../types/index';

export default (): PreprocessorGroup => ({
  async markup({ content, filename }) {
    const { transformer } = await import('../transformers/tailwind');

    return transformMarkup({ content, filename }, transformer);
  },
});
