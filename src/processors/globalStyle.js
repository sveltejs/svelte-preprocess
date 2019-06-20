const transformer = require('../transformers/globalStyle.js')

module.exports = options => {
  return {
    style({ content, attributes, filename }) {
      if (!attributes.global) return { code: content }

      return transformer({ content, filename, options })
    },
  }
}
