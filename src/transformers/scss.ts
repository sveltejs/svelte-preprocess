import { readFileSync } from 'fs';
import { join, isAbsolute } from 'path';

import type { Importer, Result } from 'sass';

import { getIncludePaths, importAny, findUp } from '../modules/utils';
import type { Transformer, Processed, Options } from '../types';

let sass: Options.Sass['implementation'];

function getProcessedResult(result: Result): Processed {
  // For some reason, scss includes the main 'file' in the array, we don't want that
  // Unfortunately I didn't manage to reproduce this in the test env
  // More info: https://github.com/sveltejs/svelte-preprocess/issues/346
  const absoluteEntryPath = isAbsolute(result.stats.entry)
    ? result.stats.entry
    : join(process.cwd(), result.stats.entry);

  const processed = {
    code: result.css.toString(),
    map: result.map?.toString(),
    dependencies: Array.from(result.stats.includedFiles).filter(
      (filepath) => filepath !== absoluteEntryPath,
    ),
  };

  return processed;
}

const tildeImporter: Importer = (url, prev) => {
  if (!url.startsWith('~')) {
    return null;
  }

  // not sure why this ends up here, but let's remove it
  prev = prev.replace('http://localhost', '');

  // on windows, path comes encoded
  if (process.platform === 'win32') {
    prev = decodeURIComponent(prev);
  }

  const modulePath = join('node_modules', ...url.slice(1).split(/[\\/]/g));

  const foundPath = findUp({ what: modulePath, from: prev });

  // istanbul ignore if
  if (foundPath == null) {
    return null;
  }

  const contents = readFileSync(foundPath).toString();

  return { contents };
};

const transformer: Transformer<Options.Sass> = async ({
  content,
  filename,
  options = {},
}) => {
  let implementation = options?.implementation ?? sass;

  if (implementation == null) {
    const mod = (await importAny('sass', 'node-sass')) as { default: any };

    // eslint-disable-next-line no-multi-assign
    implementation = sass = mod.default;
  }

  const { renderSync, prependData, ...restOptions } = {
    ...options,
    includePaths: getIncludePaths(filename, options.includePaths),
    outFile: `${filename}.css`,
    omitSourceMapUrl: true, // return sourcemap only in result.map
  };

  const sassOptions = {
    ...restOptions,
    file: filename,
    data: content,
  };

  if (Array.isArray(sassOptions.importer)) {
    sassOptions.importer = [tildeImporter, ...sassOptions.importer];
  } else if (sassOptions.importer == null) {
    sassOptions.importer = [tildeImporter];
  } else {
    sassOptions.importer = [sassOptions.importer, tildeImporter];
  }

  // scss errors if passed an empty string
  if (sassOptions.data.length === 0) {
    return { code: '' };
  }

  if (renderSync) {
    return getProcessedResult(implementation!.renderSync(sassOptions));
  }

  return new Promise<Processed>((resolve, reject) => {
    implementation!.render(sassOptions, (err, result) => {
      if (err) return reject(err);

      resolve(getProcessedResult(result));
    });
  });
};

export { transformer };
