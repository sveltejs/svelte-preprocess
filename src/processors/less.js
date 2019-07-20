const transformer = require('../transformers/less.js')
const { concat, parseFile } = require('../utils.js')

module.exports = options => ({
  async style(svelteFile) {
    const { content, filename, lang, dependencies } = await parseFile(
      svelteFile,
      'css',
    )

    if (lang !== 'less') return { code: content }

    const transformed = await transformer({ content, filename, options })
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    }
  },
})
