import { getIncludePaths, concat, parseFile } from '../utils';
import { GenericObject, PreprocessorGroup } from '../typings';

export default (options: GenericObject): PreprocessorGroup => ({
  async style(svelteFile) {
    const { default: transformer } = await import('../transformers/stylus');
    const { content, filename, lang, dependencies } = await parseFile(
      svelteFile,
      'css',
    );
    if (lang !== 'stylus') return { code: content };

    options = {
      includePaths: getIncludePaths(filename),
      ...options,
    };

    const transformed = await transformer({ content, filename, options });
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});
