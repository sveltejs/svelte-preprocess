const pug = require('pug')

module.exports = function({ content, filename, options }) {
  options = {
    doctype: 'html',
    filename,
    ...options,
  }

  const code = pug.render(content, options)
  return { code }
}
