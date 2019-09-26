import transformer from '../transformers/postcss';
import { concat, parseFile } from '../utils';

/** Adapted from https://github.com/TehShrike/svelte-preprocess-postcss */
export default (options: GenericObject) => ({
  async style(svelteFile: PreprocessArgs) {
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
