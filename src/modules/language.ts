import { basename } from 'path';

import { PreprocessorArgs } from '../types';

export const SOURCE_MAP_PROP_MAP: Record<string, [string, any]> = {
  babel: ['sourceMaps', true],
  typescript: ['sourceMap', true],
  scss: ['sourceMap', true],
  less: ['sourceMap', {}],
  stylus: ['sourcemap', true],
  postcss: ['map', true],
  coffeescript: ['sourceMap', true],
  globalStyle: ['sourceMap', true],
};

export const ALIAS_MAP = new Map([
  ['pcss', 'css'],
  ['postcss', 'css'],
  ['sass', 'scss'],
  ['styl', 'stylus'],
  ['js', 'javascript'],
  ['coffee', 'coffeescript'],
  ['ts', 'typescript'],
]);

export const addLanguageAlias = (entries: Array<[string, string]>) =>
  entries.forEach((entry) => ALIAS_MAP.set(...entry));

export const getLanguageFromAlias = (alias: string | null) => {
  return ALIAS_MAP.get(alias) || alias;
};

export const getLanguage = (attributes: PreprocessorArgs['attributes']) => {
  let alias = null;

  if (attributes.lang) {
    // istanbul ignore if
    if (typeof attributes.lang !== 'string') {
      throw new Error('lang attribute must be string');
    }

    alias = attributes.lang;
  } else if (attributes.type) {
    // istanbul ignore if
    if (typeof attributes.type !== 'string') {
      throw new Error('type attribute must be string');
    }

    alias = attributes.type.replace(/^(text|application)\/(.*)$/, '$2');
  } else if (attributes.src) {
    // istanbul ignore if
    if (typeof attributes.src !== 'string') {
      throw new Error('src attribute must be string');
    }

    const parts = basename(attributes.src).split('.');

    if (parts.length > 1) {
      alias = parts.pop();
    }
  }

  return {
    lang: getLanguageFromAlias(alias),
    alias,
  };
};
