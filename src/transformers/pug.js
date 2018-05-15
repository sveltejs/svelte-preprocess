const pug = require('pug')

module.exports = function({ content, filename, options }) {
  const code = pug.render(content, options)
  return { code }
}
