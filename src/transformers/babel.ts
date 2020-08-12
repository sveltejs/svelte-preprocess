import { transformAsync, TransformOptions } from '@babel/core';

import { Transformer, Options } from '../types';

const transformer: Transformer<Options.Babel> = async ({
  content,
  filename,
  options,
  map = undefined,
}) => {
  const babelOptions = {
    ...options,
    inputSourceMap:
      typeof map === 'string' ? JSON.parse(map) : map ?? undefined,
    sourceType: 'module',
    // istanbul ignore next
    sourceMaps: !!options.sourceMaps,
    filename,
    minified: false,
    ast: false,
    code: true,
  } as TransformOptions;

  console.log(babelOptions);

  const { code, map: sourcemap } = await transformAsync(content, babelOptions);

  return {
    code,
    map: sourcemap,
  };
};

export { transformer };
