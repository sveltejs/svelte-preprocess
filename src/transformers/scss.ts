import { readFileSync } from 'fs';
import { join, isAbsolute } from 'path';

import { getIncludePaths, findUp } from '../modules/utils';

import type { Importer, Result } from 'sass';
import type { Transformer, Processed, Options } from '../types';

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
  const { render, renderSync } = await import('sass');

  // eslint-disable-next-line no-multi-assign

  const {
    renderSync: shouldRenderSync,
    prependData,
    ...restOptions
  } = {
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

  if (shouldRenderSync) {
    return getProcessedResult(renderSync(sassOptions));
  }

  return new Promise<Processed>((resolve, reject) => {
    render(sassOptions, (err, result) => {
      if (err) return reject(err);

      resolve(getProcessedResult(result));
    });
  });
};

export { transformer };
