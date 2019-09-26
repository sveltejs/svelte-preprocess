import { concat, parseFile } from '../utils';
import transformer from '../transformers/typescript';

export default (options: GenericObject) => ({
  async script(svelteFile: PreprocessArgs) {
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
