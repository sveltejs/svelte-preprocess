import { Options, PreprocessorGroup } from '../types/index';
import { prepareContent } from '../modules/prepareContent';
import { Pug } from '../types/options';
import { transformMarkup } from '../modules/markup';

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

    return transformMarkup(false, { content, filename }, transformer, options);
  },

  markup_sync({ content, filename }) {
    const { transformer } = require('../transformers/pug');

    content = prepareContent({
      options: {
        ...options,
        stripIndent: true,
      },
      content,
    });

    return transformMarkup<true>(
      true,
      { content, filename },
      transformer,
      options,
    );
  },
});
