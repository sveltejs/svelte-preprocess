const stylus = require('stylus')

const { getIncludePaths } = require('../utils.js')

module.exports = function({
  content,
  filename,
  options = {
    paths: getIncludePaths(filename),
  },
}) {
  return new Promise((resolve, reject) => {
    const style = stylus(content, {
      filename,
      sourcemap: true,
      ...options,
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
