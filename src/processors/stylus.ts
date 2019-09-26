import transformer from '../transformers/stylus';
import { getIncludePaths, concat, parseFile } from '../utils';

export default (options: GenericObject) => ({
  async style(svelteFile: PreprocessArgs) {
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
