import { PreprocessorGroup, Options } from '../types';
import { concat, parseFile } from '../utils';

export default (options: Options.Coffeescript): PreprocessorGroup => ({
  async script(svelteFile) {
    const { default: transformer } = await import(
      '../transformers/coffeescript'
    );

    const { content, filename, lang, dependencies } = await parseFile(
      svelteFile,
      'javascript',
    );

    if (lang !== 'coffeescript') return { code: content };

    const transformed = await transformer({ content, filename, options });
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});
