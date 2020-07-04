import { PreprocessorGroup, Options } from '../types';
import { getTagInfo } from '../modules/tagInfo';
import { concat } from '../modules/concat';
import { prepareContent } from '../modules/prepareContent';

export default (options?: Options.Sass): PreprocessorGroup => ({
  async style(svelteFile) {
    const { transformer } = await import('../transformers/scss');
    let {
      content,
      filename,
      attributes,
      lang,
      alias,
      dependencies,
    } = await getTagInfo(svelteFile);

    content = prepareContent({ options, content });

    if (lang !== 'scss') {
      return { code: content };
    }

    if (alias === 'sass') {
      options = {
        ...options,
        indentedSyntax: true,
      };
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
