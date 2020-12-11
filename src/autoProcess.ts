/* eslint-disable @typescript-eslint/naming-convention */
import { PreprocessorOptions } from 'svelte/types/compiler/preprocess';

import {
  PreprocessorGroup,
  TransformerArgs,
  TransformerOptions,
  Transformers,
  Options,
} from './types';
import { hasDepInstalled, concat } from './modules/utils';
import { getTagInfoSync } from './modules/tagInfo';
import {
  addLanguageAlias,
  getLanguageFromAlias,
  SOURCE_MAP_PROP_MAP,
  getLanguage,
  getLanguageDefaults,
} from './modules/language';
import { prepareContent } from './modules/prepareContent';
import { transformMarkup } from './modules/markup';
import { default as pipe, EventuallyProcessed } from './pipe';

type AutoPreprocessGroup = PreprocessorGroup & {
  defaultLanguages: Readonly<{
    markup: string;
    style: string;
    script: string;
  }>;
};

type AutoPreprocessOptions = {
  markupTagName?: string;
  aliases?: Array<[string, string]>;
  preserve?: string[];
  defaults?: {
    markup?: string;
    style?: string;
    script?: string;
  };
  sourceMap?: boolean;

  // transformers
  babel?: TransformerOptions<Options.Babel>;
  typescript?: TransformerOptions<Options.Typescript>;
  scss?: TransformerOptions<Options.Sass>;
  sass?: TransformerOptions<Options.Sass>;
  less?: TransformerOptions<Options.Less>;
  stylus?: TransformerOptions<Options.Stylus>;
  postcss?: TransformerOptions<Options.Postcss>;
  coffeescript?: TransformerOptions<Options.Coffeescript>;
  pug?: TransformerOptions<Options.Pug>;
  globalStyle?: Options.GlobalStyle | boolean;
  replace?: Options.Replace;

  // workaround while we don't have this
  // https://github.com/microsoft/TypeScript/issues/17867
  [languageName: string]: TransformerOptions;
};

export function transform<Sync>(
  name: string,
  options: TransformerOptions,
  { content, map, filename, attributes }: TransformerArgs<any>,
  sync: Sync,
): EventuallyProcessed<Sync> {
  if (options === false) {
    const res = { code: content };

    return (sync ? res : Promise.resolve(res)) as any;
  }

  if (typeof options === 'function') {
    return options({ content, map, filename, attributes });
  }

  // todo: maybe add a try-catch here looking for module-not-found errors
  const { transformer, is_sync } = require(`./transformers/${name}`);

  if (sync && !is_sync) {
    console.error(`Transfomer ${name} does not support sync calls.`)

    return {
      code: content,
      map,
      dependencies: [],
    } as EventuallyProcessed<Sync>;
  }

  return transformer({
    content,
    filename,
    map,
    attributes,
    options: typeof options === 'boolean' ? null : options,
  });
}

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

  const transformers = rest as Transformers;

  if (aliases?.length) {
    addLanguageAlias(aliases);
  }

  const getTransformerOptions = (
    name: string,
    alias?: string,
  ): TransformerOptions<unknown> => {
    const { [name]: nameOpts, [alias]: aliasOpts } = transformers;

    if (typeof aliasOpts === 'function') return aliasOpts;
    if (typeof nameOpts === 'function') return nameOpts;
    if (aliasOpts === false || nameOpts === false) return false;

    const opts: Record<string, any> = {};

    if (typeof nameOpts === 'object') {
      Object.assign(opts, nameOpts);
    }

    Object.assign(opts, getLanguageDefaults(name), getLanguageDefaults(alias));

    if (name !== alias && typeof aliasOpts === 'object') {
      Object.assign(opts, aliasOpts);
    }

    if (sourceMap && name in SOURCE_MAP_PROP_MAP) {
      const [propName, value] = SOURCE_MAP_PROP_MAP[name];

      opts[propName] = value;
    }

    return opts;
  };

  const getTransformerTo = <Sync>(
    type: 'markup' | 'script' | 'style',
    targetLanguage: string,
    sync: Sync,
  ) => (svelteFile): EventuallyProcessed<Sync> => {
    let {
      content,
      filename,
      lang,
      alias,
      dependencies,
      attributes,
    } = getTagInfoSync(svelteFile);

    if (lang == null || alias == null) {
      alias = defaultLanguages[type];
      lang = getLanguageFromAlias(alias);
    }

    if (preserve.includes(lang) || preserve.includes(alias)) {
      return { code: content } as EventuallyProcessed<Sync>;
    }

    const transformerOptions = getTransformerOptions(lang, alias);

    content = prepareContent({
      options: transformerOptions,
      content,
    });

    if (lang === targetLanguage) {
      return { code: content, dependencies } as EventuallyProcessed<Sync>;
    }

    return pipe<Sync>(
      sync,
      () =>
        transform(
          lang,
          transformerOptions,
          {
            content,
            filename,
            attributes,
          },
          sync,
        ),
      (processed) =>
        ({
          ...processed,
          dependencies: concat(dependencies, processed.dependencies),
        } as EventuallyProcessed<Sync>),
    );
  };

  const markupTransformer = getTransformerTo('markup', 'html', false);

  function buildMarkupProcessor<Sync>(
    sync: Sync,
  ): (options: PreprocessorOptions) => EventuallyProcessed<Sync> {
    return ({ content, filename }) => {
      return pipe<Sync>(
        sync,
        () => {
          if (transformers.replace) {
            return transform<Sync>(
              'replace',
              transformers.replace,
              {
                content,
                filename,
              },
              sync,
            );
          }

          return { code: content } as EventuallyProcessed<Sync>;
        },
        ({ code }) =>
          transformMarkup<Sync>(
            sync,
            { content: code, filename },
            markupTransformer,
            {
              // we only pass the markupTagName because the rest of options
              // is fetched internally by the `markupTransformer`
              markupTagName,
            },
          ),
      );
    };
  }

  function buildScriptProcessor<Sync>(
    sync: Sync,
  ): (options: PreprocessorOptions) => EventuallyProcessed<Sync> {
    return ({ content, attributes, filename }) =>
      pipe<Sync>(
        sync,
        () =>
          getTransformerTo<Sync>(
            'script',
            'javascript',
            sync,
          )({
            content,
            attributes,
            filename,
          }),
        ({ code, map, dependencies, diagnostics }) => {
          if (transformers.babel) {
            return pipe<Sync>(
              sync,
              () =>
                transform<Sync>(
                  'babel',
                  getTransformerOptions('babel'),
                  {
                    content: code,
                    map,
                    filename,
                    attributes,
                  },
                  sync,
                ),
              (transformed) => {
                code = transformed.code;
                map = transformed.map;
                dependencies = concat(dependencies, transformed.dependencies);
                diagnostics = concat(diagnostics, transformed.diagnostics);

                return {
                  code,
                  map,
                  dependencies,
                  diagnostics,
                } as EventuallyProcessed<Sync>;
              },
            );
          }

          return {
            code,
            map,
            dependencies,
            diagnostics,
          } as EventuallyProcessed<Sync>;
        },
      );
  }

  function buildStyleProcessor<Sync>(
    sync: Sync,
  ): (options: PreprocessorOptions) => EventuallyProcessed<Sync> {
    return ({ content, attributes, filename }) => {
      const hasPostCss = hasDepInstalled('postcss');

      return pipe<Sync>(
        sync,
        () =>
          getTransformerTo<Sync>(
            'style',
            'css',
            sync,
          )({
            content,
            attributes,
            filename,
          }),
        ({ code, map, dependencies }) => {
          if (hasPostCss && transformers.postcss) {
            const { alias } = getLanguage(attributes);

            return pipe<Sync>(
              sync,
              () =>
                transform(
                  'postcss',
                  getTransformerOptions('postcss', alias),
                  { content: code, map, filename, attributes },
                  sync,
                ),
              (t) =>
                ({
                  code: t.code,
                  map: t.map,
                  dependencies: concat(dependencies, t.dependencies),
                } as EventuallyProcessed<Sync>),
            );
          }

          return { code, map, dependencies } as EventuallyProcessed<Sync>;
        },
        ({ code, map, dependencies }) => {
          if (hasPostCss) {
            return pipe<Sync>(
              sync,
              () =>
                transform(
                  'globalStyle',
                  getTransformerOptions('globalStyle'),
                  { content: code, map, filename, attributes },
                  sync,
                ),
              (t) =>
                ({
                  code: t.code,
                  map: t.map,
                  dependencies,
                } as EventuallyProcessed<Sync>),
            );
          }

          return { code, map, dependencies } as EventuallyProcessed<Sync>;
        },
      );
    };
  }

  const markup: PreprocessorGroup['markup'] = buildMarkupProcessor(false);
  const markup_sync: PreprocessorGroup['markup_sync'] = buildMarkupProcessor<
    true
  >(true);

  const script: PreprocessorGroup['script'] = buildScriptProcessor(false);
  const script_sync: PreprocessorGroup['script_sync'] = buildScriptProcessor<
    true
  >(true);

  const style: PreprocessorGroup['style'] = buildStyleProcessor(false);
  const style_sync: PreprocessorGroup['style_sync'] = buildStyleProcessor<true>(
    true,
  );

  return {
    defaultLanguages,
    markup,
    markup_sync,
    script,
    script_sync,
    style,
    style_sync,
  };
}
