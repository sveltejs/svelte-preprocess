import { Options, PreprocessorGroup } from '../types';
import { getTagInfo } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

export default (options?: Options.Stylus): PreprocessorGroup => ({
  async style(svelteFile) {
    const { transformer } = await import('../transformers/stylus');
    let {
      content,
      filename,
      attributes,
      lang,
      dependencies,
    } = await getTagInfo(svelteFile);

    content = prepareContent({
      options: {
        ...options,
        stripIndent: true,
      },
      content,
    });

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
