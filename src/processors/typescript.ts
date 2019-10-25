import { Options, PreprocessorGroup } from '../typings';
import { concat, parseFile } from '../utils';

export default (options: Options.Typescript): PreprocessorGroup => ({
  async script(svelteFile) {
    const { default: transformer } = await import('../transformers/typescript');
    const { content, filename, lang, dependencies } = await parseFile(
      svelteFile,
      'javascript',
    );
    if (lang !== 'typescript') return { code: content };

    const transformed = await transformer({ content, filename, options });
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});
