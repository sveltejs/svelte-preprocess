const less = require('less/lib/less-node')

module.exports = function({ content, filename, options }) {
  return less
    .render(content, {
      sourceMap: {},
      ...options,
    })
    .then(output => ({
      code: output.css,
      map: output.map,
    }))
}
