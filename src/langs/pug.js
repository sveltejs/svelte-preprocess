const pug = require('pug')

module.exports = function(content, filename, opts) {
  const code = pug.render(content, opts)
  return {
    code,
  }
}
