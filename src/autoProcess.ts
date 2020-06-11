import stripIndent from 'strip-indent';

import {
  PreprocessorGroup,
  Preprocessor,
  Processed,
  TransformerArgs,
  TransformerOptions,
  Transformers,
  Options,
} from './types';
import { hasDepInstalled } from './modules/hasDepInstalled';
import { concat } from './modules/concat';
import { parseFile } from './modules/parseFile';
import { addLanguageAlias } from './modules/language';
import { throwError } from './modules/errors';

type AutoPreprocessOptions = {
  markupTagName?: string;
  aliases?: Array<[string, string]>;
  preserve?: string[];
  typescript?: TransformerOptions<Options.Typescript>;
  scss?: TransformerOptions<Options.Sass>;
  sass?: TransformerOptions<Options.Sass>;
  less?: TransformerOptions<Options.Less>;
  stylus?: TransformerOptions<Options.Stylus>;
  postcss?: TransformerOptions<Options.Postcss>;
  coffeescript?: TransformerOptions<Options.Coffeescript>;
  pug?: TransformerOptions<Options.Pug>;
  globalStyle?: Options.GlobalStyle;
  replace?: Options.Replace;
  // workaround while we don't have this
  // https://github.com/microsoft/TypeScript/issues/17867
  [languageName: string]:
    | string
    | Promise<string>
    | Array<[string, string]>
    | string[]
    | TransformerOptions;
};

const ALIAS_OPTION_OVERRIDES: Record<string, any> = {
  sass: {
    indentedSyntax: true,
  },
};

export const runTransformer = async (
  name: string,
  options: TransformerOptions,
  { content, map, filename, attributes }: TransformerArgs<any>,
): Promise<Processed> => {
  // remove any unnecessary indentation (useful for coffee, pug and sugarss)
  content = stripIndent(content);

  if (typeof options === 'function') {
    return options({ content, map, filename, attributes });
  }

  try {
    const { transformer } = await import(`./transformers/${name}`);

    return transformer({
      content,
      filename,
      map,
      attributes,
      options: typeof options === 'boolean' ? null : options,
    });
  } catch (e) {
    throwError(
      `Error transforming '${name}'.\n\nMessage:\n${e.message}\n\nStack:\n${e.stack}`,
    );
  }
};

export function autoPreprocess(
  {
    aliases,
    markupTagName = 'template',
    preserve = [],
    ...rest
  }: AutoPreprocessOptions = {} as AutoPreprocessOptions,
): PreprocessorGroup {
  markupTagName = markupTagName.toLocaleLowerCase();

  const transformers = rest as Transformers;
  const markupPattern = new RegExp(
    `<${markupTagName}([\\s\\S]*?)(?:>([\\s\\S]*)<\\/${markupTagName}>|/>)`,
  );

  if (aliases?.length) {
    addLanguageAlias(aliases);
  }

  const optionsCache: Record<string, any> = {};
  const getTransformerOptions = (
    lang: string,
    alias: string,
  ): TransformerOptions<unknown> => {
    if (typeof transformers[alias] === 'function') return transformers[alias];
    if (typeof transformers[lang] === 'function') return transformers[lang];
    if (optionsCache[alias] != null) return optionsCache[alias];

    const opts: TransformerOptions<unknown> = {};

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

  const getTransformerTo = (targetLanguage: string): Preprocessor => async (
    svelteFile,
  ) => {
    const {
      content,
      filename,
      lang,
      alias,
      dependencies,
      attributes,
    } = await parseFile(svelteFile, targetLanguage);

    if (preserve.includes(lang) || preserve.includes(alias)) {
      return;
    }

    if (
      lang === targetLanguage ||
      transformers[lang] === false ||
      transformers[alias] === false
    ) {
      return { code: content, dependencies };
    }

    const transformed = await runTransformer(
      lang,
      getTransformerOptions(lang, alias),
      { content: stripIndent(content), filename, attributes },
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
      if (transformers.replace) {
        const transformed = await runTransformer(
          'replace',
          transformers.replace,
          { content, filename },
        );

        content = transformed.code;
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
    async script({ content, attributes, filename }) {
      const transformResult: Processed = await scriptTransformer({
        content,
        attributes,
        filename,
      });

      if (transformResult == null) return;

      let { code, map, dependencies, diagnostics } = transformResult;

      if (transformers.babel) {
        const transformed = await runTransformer('babel', transformers.babel, {
          content: code,
          map,
          filename,
          attributes,
        });

        code = transformed.code;
        map = transformed.map;
        dependencies = concat(dependencies, transformed.dependencies);
        diagnostics = concat(diagnostics, transformed.diagnostics);
      }

      return { code, map, dependencies, diagnostics };
    },
    async style({ content, attributes, filename }) {
      const transformResult = await cssTransformer({
        content,
        attributes,
        filename,
      });

      if (transformResult == null) return;

      let { code, map, dependencies } = transformResult;

      if (await hasDepInstalled('postcss')) {
        if (transformers.postcss) {
          const transformed = await runTransformer(
            'postcss',
            transformers.postcss,
            { content: code, map, filename, attributes },
          );

          code = transformed.code;
          map = transformed.map;
          dependencies = concat(dependencies, transformed.dependencies);
        }

        const transformed = await runTransformer(
          'globalStyle',
          transformers?.globalStyle,
          { content: code, map, filename, attributes },
        );

        code = transformed.code;
        map = transformed.map;
      }

      return { code, map, dependencies };
    },
  };
}
