import { GenericObject, PreprocessArgs } from '../typings';
import transformer from '../transformers/scss';
import { getIncludePaths, concat, parseFile } from '../utils';

import { Options as SassOptions } from 'sass';

export default (options: SassOptions) => ({
  async style(svelteFile: PreprocessArgs) {
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
