import { parseFile } from '../modules/parseFile';
import { Options, PreprocessorGroup } from '../types';
import { concat } from '../modules/concat';

export default (options?: Options.Stylus): PreprocessorGroup => ({
  async style(svelteFile) {
    const { default: transformer } = await import('../transformers/stylus');
    const {
      content,
      filename,
      attributes,
      lang,
      dependencies,
    } = await parseFile(svelteFile, 'css');

    if (lang !== 'stylus') {
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
