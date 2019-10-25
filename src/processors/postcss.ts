import { concat, parseFile } from '../utils';
import { GenericObject, PreprocessorGroup } from '../typings';

/** Adapted from https://github.com/TehShrike/svelte-preprocess-postcss */
export default (options: GenericObject): PreprocessorGroup => ({
  async style(svelteFile) {
    const { default: transformer } = await import('../transformers/postcss');
    const { content, filename, dependencies } = await parseFile(
      svelteFile,
      'css',
    );

    /** If manually passed a plugins array, use it as the postcss config */
    const transformed = await transformer({ content, filename, options });
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});
