import { getTagInfo, removeSrcAttribute } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

import type { PreprocessorGroup, Options } from '../types';

const less = (options?: Options.Less): PreprocessorGroup => ({
  async style(svelteFile) {
    const { transformer } = await import('../transformers/less');
    let { content, filename, attributes, lang, dependencies } =
      await getTagInfo(svelteFile);

    if (lang !== 'less') {
      return { code: content };
    }

    content = prepareContent({ options, content });

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
export default less;
export { less };
