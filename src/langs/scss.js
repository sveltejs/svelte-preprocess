const sass = require('node-sass')

module.exports = function (content, filename, opts = {
  includePaths: ['node_modules']
}) {
  return new Promise((resolve, reject) => {
    sass.render(
      {
        data: content,
        sourceMap: true,
        outFile: filename + '.css',
        ...opts
      },
      (err, result) => {
        if (err) return reject(err)

        resolve({
          code: result.css.toString(),
          map: result.map.toString()
        })
      }
    )
  })
}
