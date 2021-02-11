import fs from 'fs';
import { resolve, dirname } from 'path';

import type { PreprocessorArgs } from '../types';
import { getLanguage } from './language';
import { isValidLocalPath } from './utils';

const { access, readFile } = fs.promises;

const resolveSrc = (importerFile: string, srcPath: string) =>
  resolve(dirname(importerFile), srcPath);

async function doesFileExist(file: string) {
  return access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export const getTagInfo = async ({
  attributes,
  filename,
  content,
}: PreprocessorArgs) => {
  const dependencies = [];
  // catches empty content and self-closing tags
  const isEmptyContent = content == null || content.trim().length === 0;

  /** only include src file if content of tag is empty */
  if (attributes.src && isEmptyContent) {
    // istanbul ignore if
    if (typeof attributes.src !== 'string') {
      throw new Error('src attribute must be string');
    }

    let path = attributes.src;

    /** Only try to get local files (path starts with ./ or ../) */
    if (isValidLocalPath(path)) {
      path = resolveSrc(filename, path);
      if (await doesFileExist(path)) {
        content = (await readFile(path)).toString();
        dependencies.push(path);
      } else {
        console.warn(`[svelte-preprocess] The file "${path}" was not found.`);
      }
    }
  }

  const { lang, alias } = getLanguage(attributes);

  return {
    filename,
    attributes,
    content,
    lang,
    alias,
    dependencies,
  };
};
