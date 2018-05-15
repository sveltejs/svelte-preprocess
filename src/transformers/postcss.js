const postcss = require('postcss')

module.exports = (content, filename, opts = { plugins: [] }) => {
  return postcss(opts.plugins)
    .process(content, { from: filename })
    .then(({ css, map }) => ({
      code: css,
      map,
    }))
}
