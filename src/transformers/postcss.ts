import postcss from 'postcss';
import { Transformer } from '../typings';

type PostCssConfigArgs = postcss.ProcessOptions & {
  plugins: postcss.AcceptedPlugin[];
};

const process = async (
  { plugins, parser, syntax }: PostCssConfigArgs,
  content: string,
  filename: string,
  sourceMap: string | object,
) => {
  const { css, map, messages } = await postcss(plugins).process(content, {
    from: filename,
    map: {
      prev: sourceMap,
    },
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
const transformer: Transformer = async ({
  content,
  filename,
  options,
  map = undefined,
}) => {
  if (options && Array.isArray(options.plugins)) {
    return process(options as PostCssConfigArgs, content, filename, map);
  }

  try {
    /** If not, look for a postcss config file */
    const postcssLoadConfig = require(`postcss-load-config`);
    options = await postcssLoadConfig(options, options.configFilePath);
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

  return process(options as PostCssConfigArgs, content, filename, map);
};

export default transformer;
