import { getTagInfo, removeSrcAttribute } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

import type { Options, PreprocessorGroup } from '../types';

const stylus = (options?: Options.Stylus): PreprocessorGroup => ({
  async style(svelteFile) {
    const { transformer } = await import('../transformers/stylus');
    let { content, filename, attributes, lang, dependencies } =
      await getTagInfo(svelteFile);

    if (lang !== 'stylus') {
      return { code: content };
    }

    content = prepareContent({
      options: {
        ...options,
        stripIndent: true,
      },
      content,
    });

    const transformed = await transformer({
      content,
      filename,
      attributes,
      options,
    });

    return {
      ...transformed,
      attributes: removeSrcAttribute(transformed.attributes || attributes),
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});

// both for backwards compat with old svelte-preprocess versions
// (was only default export once, now is named export because of transpilation causing node not to detect the named exports of 'svelte-preprocess' otherwise)
export default stylus;
export { stylus };
