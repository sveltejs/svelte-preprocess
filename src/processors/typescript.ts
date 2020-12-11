import { Options, PreprocessorGroup } from '../types';
import { getTagInfoSync } from '../modules/tagInfo';
import { concat } from '../modules/utils';
import { prepareContent } from '../modules/prepareContent';

export default (options?: Options.Typescript): PreprocessorGroup => {
  const script = (svelteFile) => {
    const { transformer } = require('../transformers/typescript');
    let { content, filename, attributes, lang, dependencies } = getTagInfoSync(
      svelteFile,
    );

    content = prepareContent({ options, content });

    if (lang !== 'typescript') {
      return { code: content };
    }

    const transformed = transformer({
      content,
      filename,
      attributes,
      options,
    });

    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  };

  return {
    script,
    script_sync: script,
  };
};
