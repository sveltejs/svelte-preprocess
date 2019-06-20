const autoProcess = require('./autoProcess.js')

/** default auto processor */
module.exports = autoProcess

/** stand-alone processors to be included manually */
/** Markup */
module.exports.pug = opts => require(`./processors/pug.js`)(opts)

/** Script */
module.exports.coffeescript = opts =>
  require(`./processors/coffeescript.js`)(opts)
module.exports.typescript = opts => require(`./processors/typescript.js`)(opts)

/** Style */
module.exports.less = opts => require(`./processors/less.js`)(opts)
module.exports.scss = opts => require(`./processors/scss.js`)(opts)
module.exports.sass = opts => require(`./processors/scss.js`)(opts)
module.exports.stylus = opts => require(`./processors/stylus.js`)(opts)
module.exports.postcss = opts => require(`./processors/postcss.js`)(opts)
module.exports.globalStyle = opts =>
  require(`./processors/globalStyle.js`)(opts)
