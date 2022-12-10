import { basename } from 'path';

import { isValidLocalPath } from './utils';

import type { PreprocessorArgs } from '../types';

const LANGUAGE_DEFAULTS: Record<string, any> = {
  sass: {
    indentedSyntax: true,
    stripIndent: true,
  },
  pug: {
    stripIndent: true,
  },
  coffeescript: {
    stripIndent: true,
  },
  stylus: {
    stripIndent: true,
  },
  // We need to defer this require to make sugarss an optional dependency.
  sugarss: () => ({
    stripIndent: true,
    // eslint-disable-next-line @typescript-eslint/no-require-imports, node/global-require
    parser: require('sugarss'),
  }),
};

export const ALIAS_MAP = new Map([
  ['pcss', 'css'],
  ['postcss', 'css'],
  ['sugarss', 'css'],
  ['sss', 'css'],
  ['sass', 'scss'],
  ['styl', 'stylus'],
  ['js', 'javascript'],
  ['coffee', 'coffeescript'],
  ['ts', 'typescript'],
]);

export const SOURCE_MAP_PROP_MAP: Record<string, [string[], any]> = {
  babel: [['sourceMaps'], true],
  typescript: [['compilerOptions', 'sourceMap'], true],
  scss: [['sourceMap'], true],
  less: [['sourceMap'], {}],
  stylus: [['sourcemap'], true],
  postcss: [['map'], true],
  coffeescript: [['sourceMap'], true],
  globalStyle: [['sourceMap'], true],
};

export function getLanguageDefaults(
  lang?: string | null,
): null | Record<string, any> {
  if (lang == null) return null;

  const defaults = LANGUAGE_DEFAULTS[lang];

  if (!defaults) return null;

  if (typeof defaults === 'function') {
    return defaults();
  }

  return defaults;
}

export function addLanguageAlias(entries: Array<[string, string]>) {
  return entries.forEach((entry) => ALIAS_MAP.set(...entry));
}

export function getLanguageFromAlias(alias?: string | null) {
  return alias == null ? alias : ALIAS_MAP.get(alias) ?? alias;
}

export function isAliasOf(alias?: string | null, lang?: string | null) {
  return lang !== alias && getLanguageFromAlias(alias) === lang;
}

export const getLanguage = (attributes: PreprocessorArgs['attributes']) => {
  let alias: string | null = null;

  if (attributes.lang) {
    // istanbul ignore if
    if (typeof attributes.lang !== 'string') {
      throw new Error('lang attribute must be string');
    }

    alias = attributes.lang;
  } else if (
    typeof attributes.src === 'string' &&
    isValidLocalPath(attributes.src)
  ) {
    const parts = basename(attributes.src).split('.');

    if (parts.length > 1) {
      alias = parts.pop() as string;
    }
  }

  return {
    lang: getLanguageFromAlias(alias),
    alias,
  };
};
