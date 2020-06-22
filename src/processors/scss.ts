import stripIndent from 'strip-indent';

import { parseFile } from '../modules/parseFile';
import { PreprocessorGroup, Options } from '../types';
import { concat } from '../modules/concat';

export default (options?: Options.Sass): PreprocessorGroup => ({
  async style(svelteFile) {
    const { default: transformer } = await import('../transformers/scss');
    let {
      content,
      filename,
      attributes,
      lang,
      alias,
      dependencies,
    } = await parseFile(svelteFile, 'css');

    if (lang !== 'scss') {
      return { code: content };
    }

    if (alias === 'sass') {
      options = {
        ...options,
        indentedSyntax: true,
      };

      content = stripIndent(content);
    }

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
