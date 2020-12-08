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
  filename: string;
  sourceMap: string | object;
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
  }, []);

  return { code: css, map, dependencies };
}

async function getConfigFromFile(
  options: Options.Postcss,
): Promise<Options.Postcss | null> {
  try {
    /** If not, look for a postcss config file */
    const { default: postcssLoadConfig } = await import(`postcss-load-config`);
    const loadedConfig = await postcssLoadConfig(
      options,
      options?.configFilePath,
    );

    return {
      plugins: loadedConfig.plugins,
      // `postcss-load-config` puts all other props in a `options` object
      ...loadedConfig.options,
    };
  } catch (e) {
    return null;
  }
}

/** Adapted from https://github.com/TehShrike/svelte-preprocess-postcss */
const transformer: Transformer<Options.Postcss> = async ({
  content,
  filename,
  options = {},
  map,
}) => {
  let fileConfig: Options.Postcss;

  if (!options.plugins) {
    fileConfig = await getConfigFromFile(options);
    options = { ...options, ...fileConfig };
  }

  if (options.plugins || options.syntax || options.parser) {
    return process({ options, content, filename, sourceMap: map });
  }

  if (fileConfig === null) {
    console.error(
      `[svelte-preprocess] PostCSS configuration was not passed. If you expect to load it from a file make sure to install "postcss-load-config" and try again.`,
    );
  }

  return { code: content, map, dependencies: [] as any[] };
};

export { transformer };
