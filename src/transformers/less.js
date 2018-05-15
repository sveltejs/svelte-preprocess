const less = require('less/lib/less-node')

module.exports = function(content, filename, opts) {
  return less
    .render(content, {
      sourceMap: {},
      ...opts,
    })
    .then(output => ({
      code: output.css,
      map: output.map,
    }))
}
