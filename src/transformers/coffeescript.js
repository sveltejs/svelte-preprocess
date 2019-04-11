const coffeescript = require('coffeescript')

module.exports = ({ content, filename, options }) => {
  const { js: code, sourceMap: map } = coffeescript.compile(content, {
    filename,
    sourceMap: true,
    ...options,
  })

  return { code, map }
}
