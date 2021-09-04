import postcss from 'postcss';

import type { Transformer, Options } from '../types';

async function process({
  options: { plugins = [], parser, syntax } = {},
  content,
  filename,
  sourceMap,
}: {
  options: Options.Postcss;
  content: string;
  filename?: string;
  sourceMap?: string | object;
}) {
  const { css, map, messages } = await postcss(plugins).process(content, {
    from: filename,
    map: { prev: sourceMap, inline: false },
    parser,
    syntax,
  });

  const dependencies = messages.reduce((acc, msg) => {
    // istanbul ignore if
    if (msg.type !== 'dependency') return acc;
    acc.push(msg.file);

    return acc;
  }, [] as string[]);

  return { code: css, map, dependencies };
}

async function getConfigFromFile(
  options: Options.Postcss,
): Promise<{ config: Options.Postcss | null; error?: string | null }> {
  try {
    /** If not, look for a postcss config file */
    const { default: postcssLoadConfig } = await import(`postcss-load-config`);
    const loadedConfig = await postcssLoadConfig(
      options,
      options?.configFilePath,
    );

    return {
      error: null,
      config: {
        plugins: loadedConfig.plugins,
        // `postcss-load-config` puts all other props in a `options` object
        ...loadedConfig.options,
      },
    };
  } catch (e: any) {
    return {
      config: null,
      error: e,
    };
  }
}

/** Adapted from https://github.com/TehShrike/svelte-preprocess-postcss */
const transformer: Transformer<Options.Postcss> = async ({
  content,
  filename,
  options = {},
  map,
}) => {
  let fileConfig: {
    config: Options.Postcss | null;
    error?: string | null;
  } | null = null;

  if (!options.plugins) {
    fileConfig = await getConfigFromFile(options);
    options = { ...options, ...fileConfig.config };
  }

  if (options.plugins || options.syntax || options.parser) {
    return process({ options, content, filename, sourceMap: map });
  }

  if (fileConfig?.error != null) {
    console.error(
      `[svelte-preprocess] PostCSS configuration was not passed or is invalid. If you expect to load it from a file make sure to install "postcss-load-config" and try again.\n\n${fileConfig.error}`,
    );
  }

  return { code: content, map, dependencies: [] as any[] };
};

export { transformer };
