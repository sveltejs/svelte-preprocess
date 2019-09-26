import transformer from '../transformers/less';
import { concat, parseFile } from '../utils';

export default (options: GenericObject) => ({
  async style(svelteFile: PreprocessArgs) {
    const { content, filename, lang, dependencies } = await parseFile(
      svelteFile,
      'css',
    );

    if (lang !== 'less') return { code: content };

    const transformed = await transformer({
      content,
      filename,
      options,
    });
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});
