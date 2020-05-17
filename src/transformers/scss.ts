import { Result, SassException, Options as SassOptions } from 'sass';

import { importAny, getIncludePaths } from '../utils';
import { Transformer, Processed, Options } from '../types';

let sass: {
  render: (
    options: SassOptions,
    callback: (exception: SassException, result: Result) => void,
  ) => void;
  renderSync: (options: SassOptions) => Result;
};

type ResolveResult = {
  code: string;
  map: string | undefined;
  dependencies: string[];
};

function getResultForResolve(result: Result): ResolveResult {
  return {
    code: result.css.toString(),
    map: result.map?.toString(),
    dependencies: result.stats.includedFiles,
  };
}

const transformer: Transformer<Options.Sass> = async ({
  content,
  filename,
  options = {},
}) => {
  if (sass == null) {
    ({ default: sass } = await importAny('sass', 'node-sass'));
  }

  const { renderSync, ...sassOptions }: Options.Sass = {
    sourceMap: true,
    ...options,
    includePaths: getIncludePaths(filename, options.includePaths),
    outFile: `${filename}.css`,
  };

  sassOptions.data = options.data ? options.data + content : content;

  // scss errors if passed an empty string
  if (sassOptions.data.length === 0) {
    return { code: options.data };
  }

  if (renderSync) {
    return getResultForResolve(sass.renderSync(sassOptions));
  }

  return new Promise<Processed>((resolve, reject) => {
    sass.render(sassOptions, (err, result) => {
      if (err) return reject(err);

      resolve(getResultForResolve(result));
    });
  });
};

export default transformer;
