import { concat } from '../modules/utils';
import { getTagInfo, removeSrcAttribute } from '../modules/tagInfo';
import { prepareContent } from '../modules/prepareContent';

import type { PreprocessorGroup, Options } from '../types';

const babel = (options?: Options.Babel): PreprocessorGroup => ({
  async script(svelteFile) {
    const { transformer } = await import('../transformers/babel');

    let { content, filename, dependencies, attributes } =
      await getTagInfo(svelteFile);

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
export default babel;
export { babel };
