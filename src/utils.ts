import { readFile, access } from 'fs';
import { resolve, dirname, basename } from 'path';

import {
  PreprocessorArgs,
  Transformer,
  TransformerArgs,
  TransformerOptions,
} from './types';

const LANG_DICT = new Map([
  ['pcss', 'css'],
  ['postcss', 'css'],
  ['sass', 'scss'],
  ['styl', 'stylus'],
  ['js', 'javascript'],
  ['coffee', 'coffeescript'],
  ['ts', 'typescript'],
]);

const throwError = (msg: string) => {
  throw new Error(`[svelte-preprocess] ${msg}`);
};

export const concat = (...arrs: any[]): any[] =>
  arrs.reduce((acc: [], a) => (a ? acc.concat(a as any) : acc), []);

export const throwUnsupportedError = (lang: string, filename: string) =>
  throwError(`Unsupported script language '${lang}' in file '${filename}'`);

export const isFn = (maybeFn: unknown) => typeof maybeFn === 'function';

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
  return new Promise(resolve => access(file, 0, err => resolve(!err)));
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

  const { lang, alias } = exports.getLanguage(attributes, language);

  return {
    filename,
    attributes,
    content,
    lang,
    alias,
    dependencies,
  };
};

export const addLanguageAlias = (entries: Array<[string, string]>) =>
  entries.forEach(entry => LANG_DICT.set(...entry));

/** Paths used by preprocessors to resolve @imports */
export const getIncludePaths = (fromFilename: string, base: string[] = []) => [
  ...new Set([...base, 'node_modules', process.cwd(), dirname(fromFilename)]),
];

export const getLanguage = (
  attributes: PreprocessorArgs['attributes'],
  defaultLang: string,
) => {
  let lang = defaultLang;

  if (attributes.lang) {
    // istanbul ignore if
    if (typeof attributes.lang !== 'string') {
      throw new Error('lang attribute must be string');
    }
    lang = attributes.lang;
  } else if (attributes.type) {
    // istanbul ignore if
    if (typeof attributes.type !== 'string') {
      throw new Error('type attribute must be string');
    }
    lang = attributes.type.replace(/^(text|application)\/(.*)$/, '$2');
  } else if (attributes.src) {
    // istanbul ignore if
    if (typeof attributes.src !== 'string') {
      throw new Error('src attribute must be string');
    }
    const parts = basename(attributes.src).split('.');
    lang = parts.length > 1 ? parts.pop() : defaultLang;
  }

  return {
    lang: LANG_DICT.get(lang) || lang,
    alias: lang,
  };
};

const TRANSFORMERS = {} as {
  [key: string]: Transformer<any>;
};

export const runTransformer = async (
  name: string,
  options: TransformerOptions<any>,
  { content, map, filename }: TransformerArgs<any>,
) => {
  if (typeof options === 'function') {
    return options({ content, map, filename });
  }

  try {
    if (!TRANSFORMERS[name]) {
      await import(`./transformers/${name}`).then(mod => {
        // istanbul ignore else
        TRANSFORMERS[name] = mod.default;
      });
    }

    return TRANSFORMERS[name]({
      content,
      filename,
      map,
      options: typeof options === 'boolean' ? null : options,
    });
  } catch (e) {
    throwError(
      `Error transforming '${name}'.\n\nMessage:\n${e.message}\n\nStack:\n${e.stack}`,
    );
  }
};

export const importAny = async (...modules: string[]) => {
  try {
    const mod = await modules.reduce(
      (acc, moduleName) => acc.catch(() => import(moduleName)),
      Promise.reject(),
    );
    return mod;
  } catch (e) {
    throw new Error(`Cannot find any of modules: ${modules}`);
  }
};
