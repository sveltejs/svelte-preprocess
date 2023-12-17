import { hasDepInstalled, concat, setProp } from './modules/utils';
import { getTagInfo } from './modules/tagInfo';
import {
  addLanguageAlias,
  getLanguageFromAlias,
  SOURCE_MAP_PROP_MAP,
  getLanguage,
  getLanguageDefaults,
  isAliasOf,
} from './modules/language';
import { prepareContent } from './modules/prepareContent';
import { transformMarkup } from './modules/markup';

import type {
  AutoPreprocessGroup,
  AutoPreprocessOptions,
  PreprocessorGroup,
  Preprocessor,
  Processed,
  TransformerArgs,
  TransformerOptions,
  Transformers,
} from './types';

const TARGET_LANGUAGES = Object.freeze({
  markup: 'html',
  style: 'css',
  script: 'javascript',
});

export const transform = async (
  name: string | null | undefined,
  options: TransformerOptions,
  { content, markup, map, filename, attributes }: TransformerArgs<any>,
): Promise<Processed> => {
  if (name == null || options === false) {
    return { code: content };
  }

  if (typeof options === 'function') {
    return options({ content, map, filename, attributes });
  }

  // todo: maybe add a try-catch here looking for module-not-found errors
  const { transformer } = await import(`./transformers/${name}`);

  return transformer({
    content,
    markup,
    filename,
    map,
    attributes,
    options: typeof options === 'boolean' ? null : options,
  });
};

export function sveltePreprocess(
  {
    aliases,
    markupTagName = 'template',
    sourceMap = process?.env?.NODE_ENV === 'development' ?? false,
    ...rest
  } = {} as AutoPreprocessOptions,
): AutoPreprocessGroup {
  const transformers = rest as Transformers;

  if (aliases?.length) {
    addLanguageAlias(aliases);
  }

  function resolveLanguageArgs(lang: string, alias?: string | null) {
    const langOpts = transformers[lang];
    const aliasOpts = alias ? transformers[alias] : undefined;

    const opts: Record<string, any> = {};

    if (typeof langOpts === 'object') {
      Object.assign(opts, langOpts);
    }

    Object.assign(opts, getLanguageDefaults(lang), getLanguageDefaults(alias));

    if (lang !== alias && typeof aliasOpts === 'object') {
      Object.assign(opts, aliasOpts);
    }

    if (sourceMap && lang in SOURCE_MAP_PROP_MAP) {
      const [path, value] = SOURCE_MAP_PROP_MAP[lang];

      setProp(opts, path, value);
    }

    return opts;
  }

  function getTransformerOptions(
    lang?: string | null,
    alias?: string | null,
    { ignoreAliasOverride }: { ignoreAliasOverride?: boolean } = {},
  ): TransformerOptions<unknown> {
    if (lang == null) return null;

    const langOpts = transformers[lang];
    const aliasOpts = alias ? transformers[alias] : undefined;

    if (!ignoreAliasOverride && typeof aliasOpts === 'function') {
      return aliasOpts;
    }

    if (typeof langOpts === 'function') return langOpts;
    if (aliasOpts === false || langOpts === false) return false;

    return resolveLanguageArgs(lang, alias);
  }

  const getTransformerTo =
    (
      type: 'markup' | 'script' | 'style',
      targetLanguage: string,
    ): Preprocessor =>
    async (svelteFile) => {
      let { content, markup, filename, lang, alias, dependencies, attributes } =
        await getTagInfo(svelteFile);

      if (lang == null || alias == null) {
        alias = TARGET_LANGUAGES[type];
        lang = getLanguageFromAlias(alias);
      }

      const transformerOptions = getTransformerOptions(lang, alias);

      content = prepareContent({
        options: transformerOptions,
        content,
      });

      if (lang === targetLanguage) {
        // has override method for alias
        // example: sugarss override should work apart from postcss
        if (typeof transformerOptions === 'function' && alias !== lang) {
          return transformerOptions({ content, filename, attributes });
        }

        // otherwise, we're done here
        return { code: content, dependencies };
      }

      const transformed = await transform(lang, transformerOptions, {
        content,
        markup,
        filename,
        attributes,
      });

      return {
        ...transformed,
        dependencies: concat(dependencies, transformed.dependencies),
      };
    };

  const scriptTransformer = getTransformerTo('script', 'javascript');
  const cssTransformer = getTransformerTo('style', 'css');
  const markupTransformer = getTransformerTo('markup', 'html');

  const markup: PreprocessorGroup['markup'] = async ({ content, filename }) => {
    if (transformers.replace) {
      const transformed = await transform('replace', transformers.replace, {
        content,
        markup: content,
        filename,
      });

      content = transformed.code;
    }

    return transformMarkup({ content, filename }, markupTransformer, {
      // we only pass the markupTagName because the rest of options
      // is fetched internally by the `markupTransformer`
      markupTagName,
    });
  };

  const script: PreprocessorGroup['script'] = async ({
    content,
    attributes,
    markup: fullMarkup,
    filename,
  }) => {
    const transformResult = await scriptTransformer({
      content,
      attributes,
      markup: fullMarkup,
      filename,
    });

    let { code, map, dependencies, diagnostics } = transformResult;

    if (transformers.babel) {
      const transformed = await transform(
        'babel',
        getTransformerOptions('babel'),
        { content: code, markup: fullMarkup, map, filename, attributes },
      );

      code = transformed.code;
      map = transformed.map;
      dependencies = concat(dependencies, transformed.dependencies);
      diagnostics = concat(diagnostics, transformed.diagnostics);
    }

    return { code, map, dependencies, diagnostics };
  };

  const style: PreprocessorGroup['style'] = async ({
    content,
    attributes,
    markup: fullMarkup,
    filename,
  }) => {
    const transformResult = await cssTransformer({
      content,
      attributes,
      markup: fullMarkup,
      filename,
    });

    let { code, map, dependencies } = transformResult;

    const hasPostcss = await hasDepInstalled('postcss');

    // istanbul ignore else
    if (hasPostcss) {
      if (transformers.postcss) {
        const { alias, lang } = getLanguage(attributes);
        const postcssOptions = getTransformerOptions(
          'postcss',
          isAliasOf(alias, lang) ? alias : null,
          // todo: this seems wrong and ugly
          { ignoreAliasOverride: true },
        );

        const transformed = await transform('postcss', postcssOptions, {
          content: code,
          markup: fullMarkup,
          map,
          filename,
          attributes,
        });

        code = transformed.code;
        map = transformed.map;
        dependencies = concat(dependencies, transformed.dependencies);
      }

      const transformed = await transform(
        'globalStyle',
        getTransformerOptions('globalStyle'),
        { content: code, markup: fullMarkup, map, filename, attributes },
      );

      code = transformed.code;
      map = transformed.map;
    } else if ('global' in attributes) {
      console.warn(
        `[svelte-preprocess] 'global' attribute found, but 'postcss' is not installed. 'postcss' is used to walk through the CSS and transform any necessary selector.`,
      );
    }

    return { code, map, dependencies };
  };

  return {
    markup,
    script,
    style,
  };
}
