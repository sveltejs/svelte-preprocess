const { globalifySelectors } = require('../utils')

module.exports = ({ content, filename, options }) => {
  const code = globalifySelectors(content)

  return { code }
}
