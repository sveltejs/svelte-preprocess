import { PreprocessorGroup, Options } from '../types';
import { parseFile } from '../modules/parseFile';
import { concat } from '../modules/concat';

export default (options?: Options.Coffeescript): PreprocessorGroup => ({
  async script(svelteFile) {
    const { default: transformer } = await import(
      '../transformers/coffeescript'
    );

    const {
      content,
      filename,
      attributes,
      lang,
      dependencies,
    } = await parseFile(svelteFile, 'javascript');

    if (lang !== 'coffeescript') {
      return { code: content };
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
