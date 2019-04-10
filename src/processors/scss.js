const transformer = require('../transformers/scss.js')
const { getIncludePaths, getLanguage } = require('../utils.js')

module.exports = options => ({
  style({ content, attributes, filename }) {
    options = {
      includePaths: getIncludePaths(filename),
      ...options,
    }

    const { alias } = getLanguage(attributes, 'scss')
    if (alias === 'sass') {
      options.indentedSyntax = true
    }

    return transformer({ content, filename, options })
  },
})
