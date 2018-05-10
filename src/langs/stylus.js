const stylus = require('stylus')

module.exports = function (content, filename, opts = {
  paths: ['node_modules']
}) {
  return new Promise((resolve, reject) => {
    const style = stylus(content, {
      filename,
      sourcemap: true,
      ...opts
    })
    style.render((err, css) => {
      if (err) reject(err)

      resolve({
        code: css,
        map: style.sourcemap
      })
    })
  })
}
