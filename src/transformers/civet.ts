import civet from '@danielx/civet';

import type { Transformer, Options } from '../types';

const transformer: Transformer<Options.Civet> = ({
  content,
  filename,
  options,
}) => {
  const civetOptions = {
    filename,
    js: false,
    ...options,
  } as Omit<Options.Civet, 'bare'>;

  if (civetOptions.sourceMap) {
    const compiledTS = civet.compile(content, civetOptions);

    const map = JSON.parse(compiledTS);

    return { code: compiledTS, map };
  }

  return { code: civet.compile(content, civetOptions) };
};

export { transformer };
