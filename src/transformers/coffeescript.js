const coffeescript = require('coffeescript')

module.exports = function({ content, filename, options }) {
  const { js: code, sourceMap: map } = coffeescript.compile(content, {
    filename,
    sourceMap: true,
    ...options,
  })

  return { code, map }
}
