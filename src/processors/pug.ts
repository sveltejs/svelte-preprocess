import { Options, PreprocessorGroup } from '../types';
import { prepareContent } from '../modules/prepareContent';

export default (options?: Options.Pug): PreprocessorGroup => ({
  async markup({ content, filename }) {
    const { transformer } = await import('../transformers/pug');

    content = prepareContent({
      options: {
        ...options,
        stripIndent: true,
      },
      content,
    });

    return transformer({ content, filename, options });
  },
});
