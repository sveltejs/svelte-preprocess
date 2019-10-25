import stylus from 'stylus';

import { getIncludePaths } from '../utils';
import { Processed, Transformer } from '../typings';

const transformer: Transformer = ({ content, filename, options }) => {
  options = {
    includePaths: getIncludePaths(filename),
    ...options,
  };

  return new Promise<Processed>((resolve, reject) => {
    const style = stylus(content, {
      filename,
      ...options,
    }).set('sourcemap', options.sourcemap);

    style.render((err, css) => {
      // istanbul ignore next
      if (err) reject(err);

      resolve({
        code: css,
        map: (style as any).sourcemap,
        dependencies: style.deps(filename),
      });
    });
  });
};

export default transformer;
