const sass = require('node-sass')

const { getIncludePaths } = require('../utils.js')

module.exports = function({
  content,
  filename,
  options = {},
}) {
  let opts = Object.assign({
    includePaths: getIncludePaths(filename),
  }, options);

  return new Promise((resolve, reject) => {
    sass.render(
      {
        data: content,
        sourceMap: true,
        outFile: filename + '.css',
        ...opts,
      },
      (err, result) => {
        if (err) return reject(err)

        resolve({
          code: result.css.toString(),
          map: result.map.toString(),
        })
      },
    )
  })
}
