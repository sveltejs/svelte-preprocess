import { getTagInfo } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

import type { Options, PreprocessorGroup } from '../types';

export default (options?: Options.Stylus): PreprocessorGroup => ({
  async style(svelteFile) {
    const { transformer } = await import('../transformers/stylus');
    let { content, filename, attributes, lang, dependencies } =
      await getTagInfo(svelteFile);

    if (lang !== 'stylus') {
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
