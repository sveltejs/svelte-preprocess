import { prepareContent } from '../modules/prepareContent';
import { transformMarkup } from '../modules/markup';

import type { Options, PreprocessorGroup } from '../types/index';

const pug = (options?: Options.Pug): PreprocessorGroup => ({
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

// both for backwards compat with old svelte-preprocess versions
// (was only default export once, now is named export because of transpilation causing node not to detect the named exports of 'svelte-preprocess' otherwise)
export default pug;
export { pug };
