const stylus = require('stylus')

const { getIncludePaths } = require('../utils.js')

module.exports = ({ content, filename, options }) => {
  options = {
    includePaths: getIncludePaths(filename),
    ...options,
  }

  return new Promise((resolve, reject) => {
    const style = stylus(content, {
      filename,
      sourcemap: true,
      ...options,
    })

    style.render((err, css) => {
      // istanbul ignore next
      if (err) reject(err)

      resolve({
        code: css,
        map: style.sourcemap,
        dependencies: style.deps(),
      })
    })
  })
}
