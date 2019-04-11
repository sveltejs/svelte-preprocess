const pug = require('pug')

module.exports = ({ content, filename, options }) => {
  options = {
    doctype: 'html',
    filename,
    ...options,
  }

  const code = pug.render(content, options)
  return { code }
}
