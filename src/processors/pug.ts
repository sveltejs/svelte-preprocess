import stripIndent from 'strip-indent';

import { Options, PreprocessorGroup } from '../types';

export default (options?: Options.Pug): PreprocessorGroup => ({
  async markup({ content, filename }) {
    const { default: transformer } = await import('../transformers/pug');

    content = stripIndent(content);

    return transformer({ content, filename, options });
  },
});
