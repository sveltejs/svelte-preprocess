const autoProcess = require('./autoProcess.js')

/** default auto processor */
module.exports = autoProcess

/** stand-alone processors to be included manually */
/** Markup */
exports.pug = opts => require(`./processors/pug.js`)(opts)

/** Script */
exports.coffeescript = opts => require(`./processors/coffeescript.js`)(opts)
exports.coffee = opts => require(`./processors/coffeescript.js`)(opts)

/** Style */
exports.less = opts => require(`./processors/less.js`)(opts)
exports.scss = opts => require(`./processors/scss.js`)(opts)
exports.sass = opts => require(`./processors/scss.js`)(opts)
exports.stylus = opts => require(`./processors/stylus.js`)(opts)
exports.postcss = opts => require(`./processors/postcss.js`)(opts)
