import { Result, SassException, Options as SassOptions } from 'sass';

import { importAny, getIncludePaths } from '../utils';
import { Transformer, Processed, Options } from '../typings';

let sass: {
  render: (
    options: SassOptions,
    callback: (exception: SassException, result: Result) => void,
  ) => void;
};

const transformer: Transformer<Options.Sass> = async ({
  content,
  filename,
  options = {},
}) => {
  if (sass == null) {
    ({ default: sass } = await importAny('node-sass', 'sass'));
  }

  options = {
    sourceMap: true,
    ...options,
    includePaths: getIncludePaths(filename, options.includePaths),
    outFile: filename + '.css',
  };

  options.data = options.data ? options.data + content : content;

  // scss errors if passed an empty string
  if (options.data.length === 0) {
    return { code: options.data };
  }

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
