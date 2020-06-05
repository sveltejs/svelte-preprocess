import { PreprocessorGroup, Options } from '../types';

export default (options: Options.Replace): PreprocessorGroup => ({
  async markup({ content, filename }) {
    const { default: transformer } = await import('../transformers/replace');

    return transformer({ content, filename, options });
  },
});
