const stylus = require('stylus')

const { getIncludePaths } = require('../utils.js')

module.exports = function(
  content,
  filename,
  opts = {
    paths: getIncludePaths(filename),
  },
) {
  return new Promise((resolve, reject) => {
    const style = stylus(content, {
      filename,
      sourcemap: true,
      ...opts,
    })
    style.render((err, css) => {
      if (err) reject(err)

      resolve({
        code: css,
        map: style.sourcemap,
      })
    })
  })
}
