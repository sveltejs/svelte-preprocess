import { importAny, getIncludePaths } from '../utils';
import { Result, SassException } from 'sass';

import { GenericObject, Transformer, PreprocessResult } from '../typings';

let sass: {
  render: (
    options: GenericObject,
    callback: (err: SassException, result: Result) => void,
  ) => void;
};

const transformer: Transformer = async ({ content, filename, options }) => {
  options = {
    sourceMap: true,
    includePaths: getIncludePaths(filename),
    ...options,
    outFile: filename + '.css',
  };

  options.data = options.data ? options.data + content : content;

  if (sass == null) sass = await importAny('node-sass', 'sass');

  return new Promise<PreprocessResult>((resolve, reject) => {
    sass.render(options, (err, result) => {
      if (err) return reject(err);

      resolve({
        code: result.css.toString(),
        map: result.map ? result.map.toString() : undefined,
        dependencies: result.stats.includedFiles,
      });
    });
  });
};

export default transformer;
