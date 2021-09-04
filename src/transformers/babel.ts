import type { TransformOptions } from '@babel/core';
import { transformAsync } from '@babel/core';

import type { Transformer, Options } from '../types';

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
    sourceMaps: !!options?.sourceMaps,
    filename,
    minified: false,
    ast: false,
    code: true,
  } as TransformOptions;

  const result = await transformAsync(content, babelOptions);

  if (result == null) {
    return { code: content };
  }

  const { code, map: sourcemap } = result;

  return {
    code: code as string,
    map: sourcemap ?? undefined,
  };
};

export { transformer };
