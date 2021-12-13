import path from 'path';

import stylus from 'stylus';

import { getIncludePaths } from '../modules/utils';

import type { Transformer, Options } from '../types';

const transformer: Transformer<Options.Stylus> = ({
  content,
  filename,
  options = {},
}) => {
  options = {
    paths: getIncludePaths(filename, options.paths),
    ...options,
  };

  return new Promise((resolve, reject) => {
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
        // .map() necessary for windows compatibility
        dependencies: style
          .deps(filename as string)
          .map((filePath) => path.resolve(filePath)),
      });
    });
  });
};

export { transformer };
