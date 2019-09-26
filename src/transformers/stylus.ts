import stylus from 'stylus';

const { getIncludePaths } = require('../utils.js');

export default ({ content, filename, options }: TransformerArgs) => {
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
