import { concat } from '../modules/utils';
import { getTagInfo } from '../modules/tagInfo';
import { prepareContent } from '../modules/prepareContent';

import type { PreprocessorGroup, Options } from '../types';

export default (options?: Options.Babel): PreprocessorGroup => ({
  async script(svelteFile) {
    const { transformer } = await import('../transformers/babel');

    let { content, filename, dependencies, attributes } = await getTagInfo(
      svelteFile,
    );

    content = prepareContent({ options, content });

    const transformed = await transformer({
      content,
      filename,
      attributes,
      options,
    });

    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  },
});
