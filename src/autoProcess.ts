import {
  PreprocessorGroup,
  Preprocessor,
  Processed,
  TransformerArgs,
  TransformerOptions,
  Transformers,
  Options,
} from './types';
import { hasDepInstalled, concat } from './modules/utils';
import { getTagInfo } from './modules/tagInfo';
import {
  addLanguageAlias,
  getLanguageFromAlias,
  SOURCE_MAP_PROP_MAP,
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

const LANG_SPECIFIC_OPTIONS: Record<string, any> = {
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
};

export const runTransformer = async (
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
    sourceMap = false,
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

    if (name !== alias) {
      Object.assign(opts, LANG_SPECIFIC_OPTIONS[alias] || null);

      if (typeof aliasOpts === 'object') {
        Object.assign(opts, aliasOpts);
      }
    }

    if (sourceMap && name in SOURCE_MAP_PROP_MAP) {
      const [propName, value] = SOURCE_MAP_PROP_MAP[name];

      opts[propName] = value;
    }

    return opts;
  };

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
      return { code: content, dependencies };
    }

    const transformed = await runTransformer(lang, transformerOptions, {
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
      const transformed = await runTransformer(
        'replace',
        transformers.replace,
        { content, filename },
      );

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
      const transformed = await runTransformer(
        'babel',
        getTransformerOptions('babel'),
        {
          content: code,
          map,
          filename,
          attributes,
        },
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

    // istanbul ignore else
    if (await hasDepInstalled('postcss')) {
      if (transformers.postcss) {
        const transformed = await runTransformer(
          'postcss',
          getTransformerOptions('postcss'),
          { content: code, map, filename, attributes },
        );

        code = transformed.code;
        map = transformed.map;
        dependencies = concat(dependencies, transformed.dependencies);
      }

      const transformed = await runTransformer(
        'globalStyle',
        getTransformerOptions('globalStyle'),
        { content: code, map, filename, attributes },
      );

      code = transformed.code;
      map = transformed.map;
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
