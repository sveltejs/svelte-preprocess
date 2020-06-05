import { transformAsync } from '@babel/core';

import { Transformer, Options } from '../types';

const transformer: Transformer<Options.Babel> = async ({
  content,
  filename,
  options,
  map = undefined,
}) => {
  if (!options) {
    return { code: content, map };
  }

  const { code, map: sourcemap } = await transformAsync(content, {
    ...options,
    inputSourceMap: map as any,
    sourceType: 'module',
    // istanbul ignore next
    sourceMaps: !!options.sourceMaps,
    filename,
    minified: false,
    ast: false,
    code: true,
  });

  return {
    code,
    map: sourcemap,
  };
};

export default transformer;
