import { concat, parseFile } from '../utils';
import { Options, PreprocessorGroup } from '../typings';

export default (options: Options.Stylus): PreprocessorGroup => ({
  async style(svelteFile) {
    const { default: transformer } = await import('../transformers/stylus');
    const { content, filename, lang, dependencies } = await parseFile(
      svelteFile,
      'css',
    );
    if (lang !== 'stylus') return { code: content };

    const transformed = await transformer({ content, filename, options });
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});
