import { transformAsync } from '@babel/core';

import type { TransformOptions } from '@babel/core';
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
    caller: {
      name: 'svelte-preprocess',
      supportsStaticESM: true,
      supportsDynamicImport: true,
      // this isn't supported by Svelte but let it error with a good error on this syntax untouched
      supportsTopLevelAwait: true,
      // todo: this can be enabled once all "peer deps" understand this
      // this syntax is supported since rollup@1.26.0 and webpack@5.0.0-beta.21
      // supportsExportNamespaceFrom: true,
      ...options?.caller,
    },
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
