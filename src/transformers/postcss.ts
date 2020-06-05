import postcss from 'postcss';

import { Transformer, Options } from '../types';

const process = async (
  { plugins, parser, syntax }: Options.Postcss,
  content: string,
  filename: string,
  sourceMap: string | object,
  // eslint-disable-next-line max-params
) => {
  const { css, map, messages } = await postcss(plugins).process(content, {
    from: filename,
    map: { prev: sourceMap },
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
};

/** Adapted from https://github.com/TehShrike/svelte-preprocess-postcss */
const transformer: Transformer<Options.Postcss> = async ({
  content,
  filename,
  options,
  map = undefined,
}) => {
  if (options && Array.isArray(options.plugins)) {
    return process(options, content, filename, map);
  }

  try {
    /** If not, look for a postcss config file */
    const { default: postcssLoadConfig } = await import(`postcss-load-config`);
    const loadedConfig = await postcssLoadConfig(
      options,
      options ? options.configFilePath : undefined,
    );

    options = {
      plugins: loadedConfig.plugins,
      // `postcss-load-config` puts all other props in a `options` object
      ...loadedConfig.options,
    };
  } catch (e) {
    /** Something went wrong, do nothing */
    // istanbul ignore next
    if (e.code === 'MODULE_NOT_FOUND') {
      console.error(
        `[svelte-preprocess] PostCSS configuration was not passed. If you expect to load it from a file, make sure to install "postcss-load-config" and try again ʕ•ᴥ•ʔ`,
      );
    } else {
      console.error(e);
    }

    return { code: content, map, dependencies: [] as any[] };
  }

  return process(options, content, filename, map);
};

export default transformer;
