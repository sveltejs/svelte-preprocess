const postcss = require('postcss')
const { PATHS } = require('../utils.js')
const { existsSync } = require('fs')
const { resolve } = require('path')

const postcssConfigPath = resolve(PATHS.CWD, 'postcss.config.js')
const hasPostcssConfig = existsSync(postcssConfigPath)

module.exports = ({ content, filename, options, map = false }) => {
  /** Try to use postcss.config.js if no config was passed */
  if (!options && hasPostcssConfig) {
    options = require(postcssConfigPath)
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
