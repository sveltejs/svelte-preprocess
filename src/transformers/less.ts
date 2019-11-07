import less from 'less';

import { getIncludePaths } from '../utils';
import { Transformer, Options } from '../typings';

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

  return {
    code: css,
    map,
    dependencies: imports,
  };
};

export default transformer;
