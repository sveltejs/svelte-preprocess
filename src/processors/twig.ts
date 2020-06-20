import { Options, PreprocessorGroup } from '../types';

export default (options?: Options.Twig): PreprocessorGroup => ({
  async markup({ content, filename }) {
    console.log('preprocessor');
    const { default: transformer } = await import('../transformers/twig');

    return transformer({ content, filename, options });
  },
});
