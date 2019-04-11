const postcss = require('postcss')
const postcssLoadConfig = require(`postcss-load-config`)

const process = async (plugins, content, filename, sourceMap) => {
  const { css, map } = await postcss(plugins).process(content, {
    from: filename,
    prev: sourceMap,
  })

  return { code: css, map }
}

/** Adapted from https://github.com/TehShrike/svelte-preprocess-postcss */
module.exports = async ({ content, filename, options, map = undefined }) => {
  /** If manually passed a plugins array, use it as the postcss config */
  if (options && options.plugins) {
    return process(options.plugins, content, filename, map)
  }

  try {
    /** If not, look for a postcss config file */
    options = await postcssLoadConfig(options, options.configFilePath)
  } catch (e) {
    /** Something went wrong, do nothing */
    console.error(e.message)
    return { code: content, map }
  }

  return process(options.plugins || [], content, filename, map)
}
