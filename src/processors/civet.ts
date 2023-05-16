import { prepareContent } from '../modules/prepareContent';
import { getTagInfo } from '../modules/tagInfo';
import { concat } from '../modules/utils';

import type { Options, PreprocessorGroup } from '../types';

export default (options?: Options.Typescript): PreprocessorGroup => ({
  async script(svelteFile) {
    const { transformer } = await import('../transformers/civet');
    let { content, markup, filename, attributes, lang, dependencies } =
      await getTagInfo(svelteFile);

    if (lang !== 'civet') {
      return { code: content };
    }

    content = prepareContent({ options, content });

    const transformed = await transformer({
      content,
      markup,
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
