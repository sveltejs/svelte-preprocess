import { basename } from 'path';

import { PreprocessorArgs } from '../types';

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
    lang: ALIAS_MAP.get(lang) || lang,
    alias: lang,
  };
};
