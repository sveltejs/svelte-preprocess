const { getLanguage } = require('../utils.js')
const transformer = require('../transformers/coffeescript.js')

module.exports = options => ({
  style({ content, attributes, filename }) {
    const { lang } = getLanguage(attributes, 'css')
    if (lang !== 'less') return { code: content }

    return transformer({ content, filename, options })
  },
})
