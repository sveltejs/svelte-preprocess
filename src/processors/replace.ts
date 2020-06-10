import type { PreprocessorGroup, Options } from '../types';

export default (options: Options.Replace): PreprocessorGroup => ({
  async markup({ content, filename }) {
    const { transformer } = await import('../transformers/replace');

    return transformer({ content, filename, options });
  },
});
