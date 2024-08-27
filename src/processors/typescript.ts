import { getTagInfo, removeSrcAttribute } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

import type { Options, PreprocessorGroup } from '../types';

const typescript = (options?: Options.Typescript): PreprocessorGroup => ({
  async script(svelteFile) {
    const { transformer } = await import('../transformers/typescript');
    let { content, markup, filename, attributes, lang, dependencies } =
      await getTagInfo(svelteFile);

    if (lang !== 'typescript') {
      return { code: content };
    }

    content = prepareContent({ options, content });

    const transformed = await transformer({
      content,
      markup,
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
export default typescript;
export { typescript };
