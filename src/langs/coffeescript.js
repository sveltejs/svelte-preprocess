const coffeescript = require('coffeescript')

module.exports = function (content, filename, opts) {
  const { js: code, sourceMap: map } = coffeescript.compile(content, {
    filename,
    sourceMap: true,
    ...opts
  })

  return { code, map }
}
