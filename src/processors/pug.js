const transformer = require('../transformers/pug.js')

module.exports = options => ({
  markup({ content, filename }) {
    return transformer({ content, filename, options })
  },
})
