import { prepareContent } from '../modules/prepareContent';
import { transformMarkup } from '../modules/markup';

import type { Options, PreprocessorGroup } from '../types/index';

export default (options?: Options.Pug): PreprocessorGroup => ({
  async markup({ content, filename }) {
    const { transformer } = await import('../transformers/pug');

    content = prepareContent({
      options: {
        ...options,
        stripIndent: true,
      },
      content,
    });

    return transformMarkup({ content, filename }, transformer, options);
  },
});
