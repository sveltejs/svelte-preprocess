const postcss = require('postcss')
const { PATHS } = require('../utils.js')
const { existsSync } = require('fs')
const { resolve } = require('path')

const postcssConfigPath = resolve(PATHS.CWD, 'postcss.config.js')
const postcssConfig = existsSync(postcssConfigPath)
  ? require(postcssConfigPath)
  : null

module.exports = ({ content, filename, options, map = false }) => {
  /** Try to use postcss.config.js if no config was passed */
  if (!options && postcssConfig) {
    options = postcssConfig
  }

  return postcss(options.plugins || options.use || [])
    .process(content, {
      from: filename,
      prev: map,
    })
    .then(({ css, map }) => ({
      code: css,
      map,
    }))
}
