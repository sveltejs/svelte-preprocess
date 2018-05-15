const postcss = require('postcss')

module.exports = ({
  content,
  filename,
  options: { plugins = [] },
  map = false,
}) => {
  return postcss(plugins)
    .process(content, {
      from: filename,
      prev: map,
    })
    .then(({ css, map }) => ({
      code: css,
      map,
    }))
}
