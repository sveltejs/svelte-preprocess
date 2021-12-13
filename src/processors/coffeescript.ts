import { getTagInfo } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

import type { PreprocessorGroup, Options } from '../types';

export default (options?: Options.Coffeescript): PreprocessorGroup => ({
  async script(svelteFile) {
    const { transformer } = await import('../transformers/coffeescript');

    let { content, filename, attributes, lang, dependencies } =
      await getTagInfo(svelteFile);

    if (lang !== 'coffeescript') {
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
