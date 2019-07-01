const less = require('less/lib/less-node')

module.exports = async ({ content, filename, options }) => {
  const { css, map, imports } = await less.render(content, {
    sourceMap: {},
    filename,
    ...options,
  })

  return {
    code: css,
    map,
    dependencies: imports,
  }
}
