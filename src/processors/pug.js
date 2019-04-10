const transformer = require('../transformers/pug.js')
const { getLanguage, processedMarkupAttrs } = require('../utils.js')

module.exports = options => ({
  markup({ content, filename }) {
    if (processedMarkupAttrs[filename]) {
      const { lang } = getLanguage(processedMarkupAttrs[filename])
      if (lang !== 'pug') return { code: content }
    }
    return transformer({ content, filename, options })
  },
})
