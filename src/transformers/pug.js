const pug = require('pug')

module.exports = function({ content, filename, options = {} }) {
  let opts = Object.assign({
    doctype: 'html',
    filename,
  }, options);

  const code = pug.render(content, opts)
  return { code }
}
