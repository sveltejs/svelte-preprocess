const { getLanguage } = require('../utils.js')
const transformer = require('../transformers/typescript.js')

module.exports = options => ({
  script({ content, attributes, filename }) {
    const { lang } = getLanguage(attributes, 'javascript')
    if (lang !== 'typescript') return { code: content }

    return transformer({ content, filename, options })
  },
})
