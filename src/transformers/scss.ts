import { readFileSync } from 'fs';
import { isAbsolute, join } from 'path';

import { getIncludePaths, findUp } from '../modules/utils';

import type { LegacySyncImporter, LegacyStringOptions } from 'sass';
import type { Transformer, Options } from '../types';

const tildeImporter: LegacySyncImporter = (url, prev) => {
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
  const { renderSync } = await import('sass');

  const { prependData, ...restOptions } = options;
  const sassOptions: LegacyStringOptions<'sync'> = {
    ...restOptions,
    includePaths: getIncludePaths(filename, options.includePaths),
    sourceMap: true,
    sourceMapEmbed: false,
    omitSourceMapUrl: true,
    outFile: `${filename}.css`,
    outputStyle: 'expanded',
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
  if (content.length === 0) {
    return { code: '' };
  }

  const compiled = renderSync(sassOptions);

  // For some reason, scss includes the main 'file' in the array, we don't want that
  // Unfortunately I didn't manage to reproduce this in the test env
  // More info: https://github.com/sveltejs/svelte-preprocess/issues/346
  const absoluteEntryPath = isAbsolute(compiled.stats.entry)
    ? compiled.stats.entry
    : join(process.cwd(), compiled.stats.entry);

  const processed = {
    code: compiled.css.toString(),
    map: compiled.map?.toString(),
    dependencies: Array.from(compiled.stats.includedFiles).filter(
      (filepath) => filepath !== absoluteEntryPath,
    ),
  };

  return processed;
};

export { transformer };
