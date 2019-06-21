const postcss = require('postcss')

const globalifyPlugin = root =>
  root.walkRules(rule => {
    if (rule.parent && rule.parent.name === 'keyframes') {
      return
    }

    rule.selectors = rule.selectors.map(selector =>
      selector.startsWith(':global') ? selector : `:global(${selector})`,
    )
  })

module.exports = async ({ content, filename, map = undefined }) => {
  const { css, map: newMap } = await postcss()
    .use(globalifyPlugin)
    .process(content, { from: filename, prev: map })

  return { code: css, map: newMap }
}
