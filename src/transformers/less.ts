import { isAbsolute, join } from 'path';

import less from 'less';

import { getIncludePaths } from '../modules/utils';

import type { Transformer, Options } from '../types';

const transformer: Transformer<Options.Less> = async ({
  content,
  filename,
  options = {},
}) => {
  options = {
    paths: getIncludePaths(filename, options.paths),
    ...options,
  };

  const { css, map, imports } = await less.render(content, {
    sourceMap: {},
    filename,
    ...options,
  });

  const dependencies = imports.map((path: string) =>
    isAbsolute(path) ? path : join(process.cwd(), path),
  );

  return {
    code: css,
    map,
    dependencies,
  };
};

export { transformer };
