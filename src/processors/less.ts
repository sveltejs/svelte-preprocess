import { getTagInfo } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

import type { PreprocessorGroup, Options } from '../types';

export default (options?: Options.Less): PreprocessorGroup => ({
  async style(svelteFile) {
    const { transformer } = await import('../transformers/less');
    let { content, filename, attributes, lang, dependencies } =
      await getTagInfo(svelteFile);

    if (lang !== 'less') {
      return { code: content };
    }

    content = prepareContent({ options, content });

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
