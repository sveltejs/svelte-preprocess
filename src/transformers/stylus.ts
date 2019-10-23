import stylus from 'stylus';
import { PreprocessResult, Transformer } from '../typings';

const { getIncludePaths } = require('../utils.js');

const transformer: Transformer = ({ content, filename, options }) => {
  options = {
    includePaths: getIncludePaths(filename),
    ...options,
  };

  return new Promise<PreprocessResult>((resolve, reject) => {
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
