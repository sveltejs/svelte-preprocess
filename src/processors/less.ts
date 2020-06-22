import { PreprocessorGroup, Options } from '../types';
import { parseFile } from '../modules/parseFile';
import { concat } from '../modules/concat';

export default (options?: Options.Less): PreprocessorGroup => ({
  async style(svelteFile) {
    const { default: transformer } = await import('../transformers/less');
    const {
      content,
      filename,
      attributes,
      lang,
      dependencies,
    } = await parseFile(svelteFile, 'css');

    if (lang !== 'less') {
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
