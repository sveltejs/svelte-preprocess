const { getLanguage } = require('../utils.js')
const transformer = require('../transformers/coffeescript.js')

module.exports = options => ({
  script({ content, attributes, filename }) {
    const { lang } = getLanguage(attributes, 'coffeescript')
    if (lang !== 'coffeescript') return { code: content }

    return transformer({ content, filename, options })
  },
})
