const transformer = require('../transformers/postcss.js')

/** Adapted from https://github.com/TehShrike/svelte-preprocess-postcss */
module.exports = options => ({
  style({ content, filename, map = null }) {
    /** If manually passed a plugins array, use it as the postcss config */
    return transformer({ content, filename, options, map })
  },
})
