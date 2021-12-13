import { getTagInfo } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

import type { PreprocessorGroup, Options } from '../types';

export default (options?: Options.Sass): PreprocessorGroup => ({
  async style(svelteFile) {
    const { transformer } = await import('../transformers/scss');
    let { content, filename, attributes, lang, alias, dependencies } =
      await getTagInfo(svelteFile);

    if (alias === 'sass') {
      options = {
        ...options,
        stripIndent: true,
        indentedSyntax: true,
      };
    }

    if (lang !== 'scss') {
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
