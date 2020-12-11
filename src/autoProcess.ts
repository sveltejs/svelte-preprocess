/* eslint-disable @typescript-eslint/naming-convention */
import {
  PreprocessorOptions,
  SyncPreprocessor,
} from 'svelte/types/compiler/preprocess';

import {
  PreprocessorGroup,
  Processed,
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

type EventuallyProcessed<S> = S extends true
  ? Processed
  : Processed | Promise<Processed>;

export const transform = <S>(
  name: string,
  options: TransformerOptions,
  { content, map, filename, attributes }: TransformerArgs<any>,
  sync: S,
): EventuallyProcessed<S> => {
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
    } as EventuallyProcessed<S>;
  }

  return transformer({
    content,
    filename,
    map,
    attributes,
    options: typeof options === 'boolean' ? null : options,
  });
};

const pipe: <S>(
  sync: S,
  start: () => EventuallyProcessed<S>,
  ...then: Array<(processed: Processed) => EventuallyProcessed<S>>
) => EventuallyProcessed<S> = (sync, start, ...then) =>
  ((sync ? pipe_sync : pipe_async) as any)(start, ...then);

async function pipe_async(
  start: () => Promise<Processed>,
  ...then: Array<(processed: Processed) => Promise<Processed>>
) {
  let processed = await start();

  for (let i = 0; i < then.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    processed = await then[i](processed);
  }

  return processed;
}

function pipe_sync(
  start: () => Processed,
  ...then: Array<(processed: Processed) => Processed>
) {
  let processed = start();

  for (let i = 0; i < then.length; i++) {
    processed = then[i](processed);
  }

  return processed;
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

  const getTransformerTo = <S>(
    type: 'markup' | 'script' | 'style',
    targetLanguage: string,
    sync: S,
  ) => (svelteFile): EventuallyProcessed<S> => {
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
      return { code: content } as EventuallyProcessed<S>;
    }

    const transformerOptions = getTransformerOptions(lang, alias);

    content = prepareContent({
      options: transformerOptions,
      content,
    });

    if (lang === targetLanguage) {
      return { code: content, dependencies } as EventuallyProcessed<S>;
    }

    return pipe<S>(
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
        } as EventuallyProcessed<S>),
    );
  };

  const scriptTransformer = getTransformerTo('script', 'javascript', false);
  const scriptTransformerSync: SyncPreprocessor = getTransformerTo(
    'script',
    'javascript',
    true,
  ) as any;

  const cssTransformer = getTransformerTo('style', 'css', false);
  const markupTransformer = getTransformerTo('markup', 'html', false);

  const markup: PreprocessorGroup['markup'] = ({ content, filename }) => {
    return pipe(
      false,
      () => {
        if (transformers.replace) {
          return transform(
            'replace',
            transformers.replace,
            {
              content,
              filename,
            },
            false,
          );
        }

        return { code: content };
      },
      ({ code }) => {
        return transformMarkup({ content: code, filename }, markupTransformer, {
          // we only pass the markupTagName because the rest of options
          // is fetched internally by the `markupTransformer`
          markupTagName,
        });
      },
    );
  };

  function buildScriptProcessor<S>(
    sync: S,
  ): (options: PreprocessorOptions) => EventuallyProcessed<S> {
    return ({ content, attributes, filename }) =>
      pipe<S>(
        sync,
        () =>
          getTransformerTo<S>(
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
            return pipe<S>(
              sync,
              () =>
                transform<S>(
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
                } as EventuallyProcessed<S>;
              },
            );
          }

          return {
            code,
            map,
            dependencies,
            diagnostics,
          } as EventuallyProcessed<S>;
        },
      );
  }

  const script: PreprocessorGroup['script'] = buildScriptProcessor(false);
  const script_sync: PreprocessorGroup['script_sync'] = buildScriptProcessor<
    true
  >(true);

  function buildStyleProcessor<S>(
    sync: S,
  ): (options: PreprocessorOptions) => EventuallyProcessed<S> {
    return ({ content, attributes, filename }) => {
      const hasPostCss = hasDepInstalled('postcss');

      return pipe<S>(
        sync,
        () =>
          getTransformerTo<S>(
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

            return pipe<S>(
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
                } as EventuallyProcessed<S>),
            );
          }

          return { code, map, dependencies } as EventuallyProcessed<S>;
        },
        ({ code, map, dependencies }) => {
          if (hasPostCss) {
            return pipe<S>(
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
                } as EventuallyProcessed<S>),
            );
          }

          return { code, map, dependencies } as EventuallyProcessed<S>;
        },
      );
    };
  }

  const style: PreprocessorGroup['style'] = buildStyleProcessor(false);

  return {
    defaultLanguages,
    markup,
    script,
    script_sync,
    style,
  };
}
