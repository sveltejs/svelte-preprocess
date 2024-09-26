import { getTagInfo, removeSrcAttribute } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

import type { PreprocessorGroup, Options } from '../types';

const scss = (options?: Options.Sass): PreprocessorGroup => ({
  async style(svelteFile) {
    const { transformer } = await import('../transformers/scss');
    let { content, filename, attributes, lang, alias, dependencies } =
      await getTagInfo(svelteFile);

    if (alias === 'sass') {
      options = {
        ...options,
        stripIndent: true,
        indentedSyntax: true,
      };
    }

    if (lang !== 'scss') {
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
export default scss;
export { scss, scss as sass };
