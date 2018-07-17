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
module.exports = ({ content, filename, options = {}, map = false }) => {
  return postcssLoadConfig(options, options.configFilePath)
    .then(options => process(options.plugins || [], content, filename, map))
    .catch(e => process(options.plugins || [], content, filename, map))
}
