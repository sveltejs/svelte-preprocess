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

export const transform = async (
  name: string,
  options: TransformerOptions,
  { content, map, filename, attributes }: TransformerArgs<any>,
): Promise<Processed> => {
  if (options === false) {
    return { code: content };
  }

  if (typeof options === 'function') {
    return options({ content, map, filename, attributes });
  }

  // todo: maybe add a try-catch here looking for module-not-found errors
  const { transformer } = await import(`./transformers/${name}`);

  return transformer({
    content,
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
    preserve = [],
    defaults,
    sourceMap = process?.env?.NODE_ENV === 'development' ?? false,
    ...rest
  } = {} as AutoPreprocessOptions,
): AutoPreprocessGroup {
  const defaultLanguages = Object.freeze({
    markup: 'html',
    style: 'css',
    script: 'javascript',
    ...defaults,
  });

  // todo: remove this on v5
  if (defaults != null) {
    console.warn(
      '[svelte-preprocess] Deprecation notice: using the "defaults" option is no longer recommended and will be removed in the next major version. Instead, define the language being used explicitly via the lang attribute.\n\nSee https://github.com/sveltejs/svelte-preprocess/issues/362',
    );
  }

  const transformers = rest as Transformers;

  if (aliases?.length) {
    addLanguageAlias(aliases);
  }

  function resolveLanguageArgs(name: string, alias?: string) {
    const { [name]: nameOpts, [alias]: aliasOpts } = transformers;
    const opts: Record<string, any> = {};

    if (typeof nameOpts === 'object') {
      Object.assign(opts, nameOpts);
    }

    Object.assign(opts, getLanguageDefaults(name), getLanguageDefaults(alias));

    if (name !== alias && typeof aliasOpts === 'object') {
      Object.assign(opts, aliasOpts);
    }

    if (sourceMap && name in SOURCE_MAP_PROP_MAP) {
      const [path, value] = SOURCE_MAP_PROP_MAP[name];

      setProp(opts, path, value);
    }

    return opts;
  }

  function getTransformerOptions(
    lang: string,
    alias?: string,
    { ignoreAliasOverride }: { ignoreAliasOverride?: boolean } = {},
  ): TransformerOptions<unknown> {
    const { [lang]: langOpts, [alias]: aliasOpts } = transformers;

    if (!ignoreAliasOverride && typeof aliasOpts === 'function') {
      return aliasOpts;
    }

    if (typeof langOpts === 'function') return langOpts;
    if (aliasOpts === false || langOpts === false) return false;

    return resolveLanguageArgs(lang, alias);
  }

  const getTransformerTo = (
    type: 'markup' | 'script' | 'style',
    targetLanguage: string,
  ): Preprocessor => async (svelteFile) => {
    let {
      content,
      filename,
      lang,
      alias,
      dependencies,
      attributes,
    } = await getTagInfo(svelteFile);

    if (lang == null || alias == null) {
      alias = defaultLanguages[type];
      lang = getLanguageFromAlias(alias);
    }

    if (preserve.includes(lang) || preserve.includes(alias)) {
      return { code: content };
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
    filename,
  }) => {
    const transformResult: Processed = await scriptTransformer({
      content,
      attributes,
      filename,
    });

    let { code, map, dependencies, diagnostics } = transformResult;

    if (transformers.babel) {
      const transformed = await transform(
        'babel',
        getTransformerOptions('babel'),
        { content: code, map, filename, attributes },
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
    filename,
  }) => {
    const transformResult = await cssTransformer({
      content,
      attributes,
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
        { content: code, map, filename, attributes },
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
    defaultLanguages,
    markup,
    script,
    style,
  };
}
