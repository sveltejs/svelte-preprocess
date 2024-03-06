import { getTagInfo } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

import type { PreprocessorGroup, Options } from '../types';

export default (options?: Options.Civet): PreprocessorGroup => ({
  async script(svelteFile) {
    const { transformer } = await import('../transformers/civet');

    let { content, filename, attributes, lang, dependencies } =
      await getTagInfo(svelteFile);

    if (lang !== 'civet') {
      return { code: content };
    }

    content = prepareContent({
      options: {
        ...options,
        stripIndent: true,
      },
      content,
    });

    const transformed = await transformer({
      content,
      filename,
      attributes,
      options,
    });

    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});
