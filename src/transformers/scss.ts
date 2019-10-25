import { Result, SassException, Options as SassOptions } from 'sass';

import { importAny, getIncludePaths } from '../utils';
import { Transformer, Processed } from '../typings';

let sass: {
  render: (
    options: SassOptions,
    callback: (exception: SassException, result: Result) => void,
  ) => void;
};

const transformer: Transformer = async ({ content, filename, options }) => {
  if (sass == null) {
    ({ default: sass } = await importAny('node-sass', 'sass'));
  }

  options = {
    sourceMap: true,
    includePaths: getIncludePaths(filename),
    ...options,
    outFile: filename + '.css',
  };

  options.data = options.data ? options.data + content : content;

  return new Promise<Processed>((resolve, reject) => {
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
