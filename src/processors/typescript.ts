import { Options, PreprocessorGroup } from '../types';
import { parseFile } from '../modules/parseFile';
import { concat } from '../modules/concat';

export default (options?: Options.Typescript): PreprocessorGroup => ({
  async script(svelteFile) {
    const { default: transformer } = await import('../transformers/typescript');
    const {
      content,
      filename,
      attributes,
      lang,
      dependencies,
    } = await parseFile(svelteFile, 'javascript');

    if (lang !== 'typescript') {
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
