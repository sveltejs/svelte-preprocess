const transformer = require('../transformers/postcss.js')
const { concat, parseFile } = require('../utils.js')

/** Adapted from https://github.com/TehShrike/svelte-preprocess-postcss */
module.exports = options => ({
  async style(svelteFile) {
    const { content, filename, dependencies } = await parseFile(
      svelteFile,
      'css',
    )

    /** If manually passed a plugins array, use it as the postcss config */
    const transformed = await transformer({ content, filename, options })
    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    }
  },
})
