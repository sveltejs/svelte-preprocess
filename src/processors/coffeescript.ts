import transformer from '../transformers/coffeescript.js';
import { concat, parseFile } from '../utils.js';

export default (options: GenericObject) => ({
  async script(svelteFile: PreprocessArgs) {
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
