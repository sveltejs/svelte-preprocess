import { GenericObject, PreprocessorGroup } from '../typings';
import { concat, parseFile } from '../utils';

export default (options: GenericObject): PreprocessorGroup => ({
  async style(svelteFile) {
    const { default: transformer } = await import('../transformers/less');
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
