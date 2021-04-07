/* eslint-disable node/prefer-promises/fs */
import { readFile, access } from 'fs';
import { resolve, dirname } from 'path';

import type { PreprocessorArgs } from '../types';
import { getLanguage } from './language';
import { isValidLocalPath } from './utils';

const resolveSrc = (importerFile: string, srcPath: string) =>
  resolve(dirname(importerFile), srcPath);

const getSrcContent = (file: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    readFile(file, (error: Error, data: unknown) => {
      // istanbul ignore if
      if (error) reject(error);
      else resolve(data.toString());
    });
  });
};

async function doesFileExist(file: string) {
  return new Promise((resolve) => access(file, 0, (err) => resolve(!err)));
}

export const getTagInfo = async ({
  attributes,
  filename,
  content,
  markup,
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
        content = await getSrcContent(path);
        dependencies.push(path);
      } else {
        console.warn(`[svelte-preprocess] The file  "${path}" was not found.`);
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
    markup,
  };
};
