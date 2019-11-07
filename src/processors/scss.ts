import { concat, parseFile } from '../utils';
import { PreprocessorGroup, Options } from '../typings';

export default (options: Options.Sass): PreprocessorGroup => ({
  async style(svelteFile) {
    const { default: transformer } = await import('../transformers/scss');
    const { content, filename, lang, alias, dependencies } = await parseFile(
      svelteFile,
      'css',
    );

    if (lang !== 'scss') return { code: content };

    if (alias === 'sass') {
      options = {
        ...options,
        indentedSyntax: true,
      };
    }

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
