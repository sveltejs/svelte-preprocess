import { Options as SassOptions } from 'sass';

import { getIncludePaths, concat, parseFile } from '../utils';
import { GenericObject, PreprocessorGroup } from '../typings';

export default (options: SassOptions): PreprocessorGroup => ({
  async style(svelteFile) {
    const { default: transformer } = await import('../transformers/scss');
    const { content, filename, lang, alias, dependencies } = await parseFile(
      svelteFile,
      'css',
    );

    if (lang !== 'scss') return { code: content };

    options = {
      includePaths: getIncludePaths(filename),
      ...options,
    };

    if (alias === 'sass') {
      options.indentedSyntax = true;
    }

    const transformed = await transformer({
      content,
      filename,
      options: options as GenericObject,
    });
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});
