const postcss = require('postcss')
const postcssLoadConfig = require(`postcss-load-config`)

const process = (plugins, content, filename, map) =>
  postcss(plugins)
    .process(content, {
      from: filename,
      prev: map,
    })
    .then(({ css, map }) => ({
      code: css,
      map,
    }))

/** Adapted from https://github.com/TehShrike/svelte-preprocess-postcss */
module.exports = ({ content, filename, options = {}, map = undefined }) => {
  /** If manually passed a plugins array, use it as the postcss config */
  return typeof options.plugins !== 'undefined'
    ? process(options.plugins || [], content, filename, map)
    : /** If not, look for a postcss config file */
      postcssLoadConfig(options, options.configFilePath)
        .then(options => process(options.plugins || [], content, filename, map))
        /** No config object passed and no config file found, do nothing */
        .catch(e => {
          console.warn('\x1b[33m%s\x1b[0m',
            "[svelte-preprocess] Passed 'transformers.postcss: true' but no 'postcss.config.js' was found.",
          )
          return { code: content, map }
        })
}
