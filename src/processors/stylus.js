const transformer = require('../transformers/stylus.js')
const { getIncludePaths, concat, parseFile } = require('../utils.js')

module.exports = options => ({
  async style(svelteFile) {
    const { content, filename, lang, dependencies } = await parseFile(
      svelteFile,
      'css',
    )
    if (lang !== 'stylus') return { code: content }

    options = {
      includePaths: getIncludePaths(filename),
      ...options,
    }

    const transformed = await transformer({ content, filename, options })
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    }
  },
})
