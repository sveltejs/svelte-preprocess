import { Result } from 'sass';

import { Transformer, Processed, Options } from '../types';
import { getIncludePaths, importAny } from '../modules/utils';

let sass: Options.Sass['implementation'];

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
  let implementation = options?.implementation ?? sass;

  if (implementation == null) {
    const mod = await importAny('sass', 'node-sass');

    // eslint-disable-next-line no-multi-assign
    implementation = sass = mod.default;
  }

  const { renderSync, prependData, ...restOptions } = {
    ...options,
    includePaths: getIncludePaths(filename, options.includePaths),
    outFile: `${filename}.css`,
  };

  const sassOptions = {
    ...restOptions,
    data: content,
  };

  // scss errors if passed an empty string
  if (sassOptions.data.length === 0) {
    return { code: '' };
  }

  if (renderSync) {
    return getResultForResolve(implementation.renderSync(sassOptions));
  }

  return new Promise<Processed>((resolve, reject) => {
    implementation.render(sassOptions, (err, result) => {
      if (err) return reject(err);

      resolve(getResultForResolve(result));
    });
  });
};

export { transformer };
