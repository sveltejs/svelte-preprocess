const autoProcess = require('./autoProcess.js')

const coffeescript = require('./processors/coffeescript.js')
const less = require('./processors/less.js')
const postcss = require('./processors/postcss.js')
const pug = require('./processors/pug.js')
const scss = require('./processors/scss.js')
const stylus = require('./processors/stylus.js')

/** default auto processor */
module.exports = autoProcess

/** stand-alone processors to be included manually */

/** Markup */
exports.pug = pug

/** Script */
exports.coffeescript = coffeescript
exports.coffee = coffeescript

/** Style */
exports.less = less
exports.scss = scss
exports.sass = scss
exports.stylus = stylus
exports.postcss = postcss
