import { twig } from 'twig';

import { Transformer, Options } from '../types';

const transformer: Transformer<Options.Twig> = async ({ content, options }) => {
  options = {
    ...options,
    data: content,
    allowInlineIncludes: true,
  };
  const compiled = twig({ ...options }).render();

  return {
    code: compiled,
    dependencies: null,
  };
};

export default transformer;
