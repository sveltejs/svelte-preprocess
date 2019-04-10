const transformer = require('../transformers/scss.js')

const { getIncludePaths, getLanguage } = require('../utils.js')

module.exports = options => ({
  style({ content, filename, attributes }) {
    const { lang } = getLanguage(attributes, 'css')
    if (lang !== 'stylus') return { code: content }

    options = {
      includePaths: getIncludePaths(filename),
      ...options,
    }

    return transformer({ content, filename, options })
  },
})
