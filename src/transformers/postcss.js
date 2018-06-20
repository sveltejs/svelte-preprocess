const postcss = require('postcss')
const cosmiconfig = require('cosmiconfig')
const postcssConfig = cosmiconfig('postcss').searchSync()

module.exports = ({ content, filename, options, map = false }) => {
  /** Try to use postcss.config.js if no config was passed */
  if (!options && postcssConfig) {
    options = require(postcssConfig.filepath)
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
