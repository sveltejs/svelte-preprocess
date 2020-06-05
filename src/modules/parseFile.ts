import { readFile, access } from 'fs';
import { resolve, dirname } from 'path';

import { PreprocessorArgs } from '../types';
import { getLanguage } from './language';

export const resolveSrc = (importerFile: string, srcPath: string) =>
  resolve(dirname(importerFile), srcPath);

export const getSrcContent = (file: string): Promise<string> => {
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

export const parseFile = async (
  { attributes, filename, content }: PreprocessorArgs,
  language: string,
) => {
  const dependencies = [];

  if (attributes.src) {
    // istanbul ignore if
    if (typeof attributes.src !== 'string') {
      throw new Error('src attribute must be string');
    }
    let path = attributes.src;

    /** Only try to get local files (path starts with ./ or ../) */
    if (path.match(/^(https?:)?\/\//) == null) {
      path = resolveSrc(filename, path);
      if (await doesFileExist(path)) {
        content = await getSrcContent(path);
        dependencies.push(path);
      }
    }
  }

  const { lang, alias } = getLanguage(attributes, language);

  return {
    filename,
    attributes,
    content,
    lang,
    alias,
    dependencies,
  };
};
