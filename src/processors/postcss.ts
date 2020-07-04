import { PreprocessorGroup, Options } from '../types';
import { getTagInfo } from '../modules/tagInfo';
import { concat } from '../modules/concat';
import { prepareContent } from '../modules/prepareContent';

/** Adapted from https://github.com/TehShrike/svelte-preprocess-postcss */
export default (options?: Options.Postcss): PreprocessorGroup => ({
  async style(svelteFile) {
    const { transformer } = await import('../transformers/postcss');
    let { content, filename, attributes, dependencies } = await getTagInfo(
      svelteFile,
    );

    content = prepareContent({ options, content });

    /** If manually passed a plugins array, use it as the postcss config */
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
