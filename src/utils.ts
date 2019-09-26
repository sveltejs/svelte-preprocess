const { readFile } = require('fs');
const { resolve, dirname, basename } = require('path');

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

export const parseFile = async (
  { attributes, filename, content }: PreprocessArgs,
  language: string,
) => {
  const dependencies = [];
  if (attributes.src && typeof attributes.src === 'string') {
    /** Ignore remote files */
    if (!attributes.src.match(/^(https?)?:?\/\/.*$/)) {
      const file = resolveSrc(filename, attributes.src);
      content = await getSrcContent(file);
      dependencies.push(file);
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
export const getIncludePaths = (fromFilename: string) =>
  [
    process.cwd(),
    fromFilename.length && dirname(fromFilename),
    resolve(process.cwd(), 'node_modules'),
  ].filter(Boolean);

export const getLanguage = (
  attributes: AttributesObject,
  defaultLang: string,
) => {
  let lang = defaultLang;

  if (attributes.lang) {
    if (typeof attributes.lang !== 'string') {
      throw new Error('lang attribute must be string');
    }
    lang = attributes.lang;
  } else if (attributes.type) {
    if (typeof attributes.type !== 'string') {
      throw new Error('lang attribute must be string');
    }
    lang = attributes.type.replace(/^(text|application)\/(.*)$/, '$2');
  } else if (attributes.src) {
    const parts = basename(attributes.src).split('.');
    lang = parts.length > 1 ? parts.pop() : defaultLang;
  }

  return {
    lang: LANG_DICT.get(lang) || lang,
    alias: lang,
  };
};

const TRANSFORMERS = {} as {
  [key: string]: (o: TransformerArgs) => any;
};

export const runTransformer = async (
  name: string,
  options: TransformerOptions,
  { content, map, filename }: TransformerArgs,
) => {
  if (typeof options === 'function') {
    return options({ content, map: map, filename });
  }

  try {
    if (!TRANSFORMERS[name]) {
      await import(`./transformers/${name}`).then(mod => {
        TRANSFORMERS[name] = mod.default || mod;
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
      `Error transforming '${name}'. Message:\n${e.message}\nStack:\n${e.stack}`,
    );
  }
};

export const importAny = async (...modules: string[]) => {
  try {
    const mod = await modules.reduce(
      (acc, moduleName) => acc.catch(() => import(moduleName)),
      Promise.reject(),
    );
    return mod
  } catch (e) {
    throw new Error(`Cannot find any of modules: ${modules}`);
  }
};
