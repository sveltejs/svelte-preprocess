const transformer = require('../transformers/scss.js')
const { getIncludePaths, concat, parseFile } = require('../utils.js')

module.exports = options => ({
  async style(svelteFile) {
    const { content, filename, lang, alias, dependencies } = await parseFile(
      svelteFile,
      'css',
    )

    if (lang !== 'scss') return { code: content }

    options = {
      includePaths: getIncludePaths(filename),
      ...options,
    }

    if (alias === 'sass') {
      options.indentedSyntax = true
    }

    const transformed = await transformer({ content, filename, options })
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    }
  },
})
