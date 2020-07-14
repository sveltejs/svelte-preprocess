import { PreprocessorGroup, Options } from '../types';
import { concat } from '../modules/utils';
import { getTagInfo } from '../modules/tagInfo';
import { prepareContent } from '../modules/prepareContent';

export default (options?: Options.Babel): PreprocessorGroup => ({
  async script(svelteFile) {
    const { transformer } = await import('../transformers/babel');

    let { content, filename, dependencies, attributes } = await getTagInfo(
      svelteFile,
    );

    content = prepareContent({ options, content, filename });

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
