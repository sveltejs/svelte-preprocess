import stripIndent from 'strip-indent';
import { version } from 'svelte/package.json';

import {
  concat,
  addLanguageAlias,
  parseFile,
  runTransformer,
  isFn,
  throwUnsupportedError,
} from './utils.js';
import {
  GenericObject,
  PreprocessorGroup,
  TransformerOptions,
  Preprocessor,
} from './typings';

interface Transformers {
  typescript?: TransformerOptions;
  scss?: TransformerOptions;
  sass?: TransformerOptions;
  less?: TransformerOptions;
  stylus?: TransformerOptions;
  postcss?: TransformerOptions;
  coffeescript?: TransformerOptions;
  pub?: TransformerOptions;
  globalStyle?: TransformerOptions;
  [languageName: string]: TransformerOptions;
}

type AutoPreprocessOptions = Transformers & {
  /** @deprecated use a array of processors since svelte v3 */
  onBefore?: ({
    content,
    filename,
  }: {
    content: string;
    filename: string;
  }) => Promise<string> | string;
  markupTagName?: string;
  transformers?: Transformers;
  aliases?: [string, string][];
  preserve?: string[];
};

const SVELTE_MAJOR_VERSION = +version[0];
const ALIAS_OPTION_OVERRIDES: GenericObject = {
  sass: {
    indentedSyntax: true,
  },
};

export function autoPreprocess(
  {
    onBefore,
    aliases,
    markupTagName = 'template',
    preserve = [],
    ...rest
  }: AutoPreprocessOptions = {} as AutoPreprocessOptions,
): PreprocessorGroup {
  markupTagName = markupTagName.toLocaleLowerCase();

  const optionsCache: GenericObject = {};
  const transformers: Transformers = rest.transformers || rest;
  const markupPattern = new RegExp(
    `<${markupTagName}([\\s\\S]*?)>([\\s\\S]*)<\\/${markupTagName}>`,
  );

  if (aliases && aliases.length) {
    addLanguageAlias(aliases);
  }

  const getTransformerOptions = (
    lang: string,
    alias: string,
  ): TransformerOptions => {
    if (isFn(transformers[alias])) return transformers[alias];
    if (isFn(transformers[lang])) return transformers[lang];
    if (optionsCache[alias] != null)
      return optionsCache[alias] as TransformerOptions;

    const opts = {} as TransformerOptions;

    if (typeof transformers[lang] === 'object') {
      Object.assign(opts, transformers[lang]);
    }

    if (lang !== alias) {
      Object.assign(opts, ALIAS_OPTION_OVERRIDES[alias] || null);

      if (typeof transformers[alias] === 'object') {
        Object.assign(opts, transformers[alias]);
      }
    }

    return (optionsCache[alias] = opts);
  };

  const getTransformerTo = (
    targetLanguage: string,
  ): Preprocessor => async svelteFile => {
    const { content, filename, lang, alias, dependencies } = await parseFile(
      svelteFile,
      targetLanguage,
    );

    if (preserve.includes(lang) || preserve.includes(alias)) {
      return;
    }

    if (lang === targetLanguage) {
      return { code: content, dependencies };
    }

    if (transformers[lang] === false || transformers[alias] === false) {
      throwUnsupportedError(alias, filename);
    }

    const transformed = await runTransformer(
      lang,
      getTransformerOptions(lang, alias),
      { content: stripIndent(content), filename },
    );

    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    };
  };

  const scriptTransformer = getTransformerTo('javascript');
  const cssTransformer = getTransformerTo('css');
  const markupTransformer = getTransformerTo('html');

  return {
    async markup({ content, filename }) {
      if (isFn(onBefore)) {
        // istanbul ignore next
        if (SVELTE_MAJOR_VERSION >= 3) {
          console.warn(
            '[svelte-preprocess] For svelte >= v3, instead of onBefore(), prefer to prepend a preprocess object to your array of preprocessors',
          );
        }
        content = await onBefore({ content, filename });
      }

      const templateMatch = content.match(markupPattern);

      /** If no <template> was found, just return the original markup */
      if (!templateMatch) {
        return { code: content };
      }

      const [fullMatch, attributesStr, templateCode] = templateMatch;

      /** Transform an attribute string into a key-value object */
      const attributes = attributesStr
        .split(/\s+/)
        .filter(Boolean)
        .reduce((acc: Record<string, string | boolean>, attr) => {
          const [name, value] = attr.split('=');
          // istanbul ignore next
          acc[name] = value ? value.replace(/['"]/g, '') : true;
          return acc;
        }, {});

      /** Transform the found template code */
      let { code, map, dependencies } = await markupTransformer({
        content: templateCode,
        attributes,
        filename,
      });

      code =
        content.slice(0, templateMatch.index) +
        code +
        content.slice(templateMatch.index + fullMatch.length);

      return { code, map, dependencies };
    },
    script: scriptTransformer,
    async style({ content, attributes, filename }) {
      let { code, map, dependencies } = await cssTransformer({
        content,
        attributes,
        filename,
      });

      if (transformers.postcss) {
        const transformed = await runTransformer(
          'postcss',
          transformers.postcss,
          { content: code, map, filename },
        );

        code = transformed.code;
        map = transformed.map;
        dependencies = concat(dependencies, transformed.dependencies);
      }

      if (attributes.global) {
        const transformed = await runTransformer('globalStyle', null, {
          content: code,
          map,
          filename,
        });

        code = transformed.code;
        map = transformed.map;
      }

      return { code, map, dependencies };
    },
  };
}
