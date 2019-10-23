import less from 'less';

import { Transformer } from '../typings';

const transformer: Transformer = async ({ content, filename, options }) => {
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
