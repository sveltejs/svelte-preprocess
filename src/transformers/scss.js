const { requireAny } = require('../utils')
const sass = requireAny('node-sass', 'sass')

const { getIncludePaths } = require('../utils.js')

module.exports = ({ content, filename, options }) => {
  options = {
    includePaths: getIncludePaths(filename),
    ...options
  }
  options.data = options.data ? options.data + content : content

  return new Promise((resolve, reject) => {
    sass.render(
      {
        sourceMap: true,
        outFile: filename + '.css',
        ...options,
      },
      (err, result) => {
        if (err) return reject(err)

        resolve({
          code: result.css.toString(),
          map: result.map ? result.map.toString() : undefined,
          dependencies: result.stats.includedFiles,
        })
      },
    )
  })
}
