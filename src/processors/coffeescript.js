const transformer = require('../transformers/coffeescript.js')
const { concat, parseFile } = require('../utils.js')

module.exports = options => ({
  async script(svelteFile) {
    const { content, filename, lang, dependencies } = await parseFile(
      svelteFile,
      'javascript',
    )

    if (lang !== 'coffeescript') return { code: content }

    const transformed = await transformer({ content, filename, options })
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    }
  },
})
