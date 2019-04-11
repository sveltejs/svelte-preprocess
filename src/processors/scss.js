const transformer = require('../transformers/scss.js')
const { getIncludePaths, getLanguage } = require('../utils.js')

module.exports = options => ({
  style({ content, attributes, filename }) {
    const { lang, alias } = getLanguage(attributes, 'css')
    if (lang !== 'scss') return { code: content }

    options = {
      includePaths: getIncludePaths(filename),
      ...options,
    }

    if (alias === 'sass') {
      options.indentedSyntax = true
    }

    return transformer({ content, filename, options })
  },
})
