const { readFileSync } = require('fs')
const { resolve, dirname } = require('path')

const transformers = {}
const CWD = process.cwd()
const PATHS = {
  CWD,
  MODULES: resolve(CWD, 'node_modules'),
}
const LANG_DICT = new Map([
  ['postcss', 'css'],
  ['sass', 'scss'],
  ['styl', 'stylus'],
  ['js', 'javascript'],
  ['coffee', 'coffeescript'],
])

exports.aliasOverrides = {
  sass: {
    indentedSyntax: true,
  },
}

exports.throwError = msg => {
  throw new Error(`[svelte-preprocess] ${msg}`)
}

exports.throwUnsupportedError = (lang, filename) =>
  exports.throwError(
    `Unsupported script language '${lang}' in file '${filename}'`,
  )

exports.isFn = maybeFn => typeof maybeFn === 'function'

/** Gets a pattern for mathing <(tag) (attrs="values")>(content)</tag> */
exports.getTagPattern = type =>
  new RegExp(`<${type}([\\s\\S]*?)>([\\s\\S]*?)<\\/${type}>`)

/** Replace a string with another value by slicing it based on a regexp match */
exports.sliceReplace = (match, str, replaceValue) =>
  str.slice(0, match.index) +
  replaceValue +
  str.slice(match.index + match[0].length)

exports.getSrcContent = (importerFile, srcPath) =>
  readFileSync(resolve(dirname(importerFile), srcPath)).toString()

exports.parseAttributes = attrsStr =>
  attrsStr
    .split(/\s+/)
    .filter(Boolean)
    .reduce((acc, attr) => {
      const [name, value] = attr.split('=')
      acc[name] = value ? value.replace(/['"]/g, '') : true
      return acc
    }, {})

exports.addLanguageAlias = entries =>
  entries.forEach(entry => LANG_DICT.set(...entry))

exports.getLanguage = (attributes, defaultLang) => {
  let lang

  if (attributes.src) {
    lang = attributes.src.match(/\.([^/.]+)$/)
    lang = lang ? lang[1] : defaultLang
  } else {
    lang = attributes.type
      ? attributes.type.replace(/^(text|application)\/(.*)$/, '$2')
      : attributes.lang || defaultLang
  }

  return {
    lang: LANG_DICT.get(lang) || lang,
    alias: lang,
  }
}

/** Paths used by preprocessors to resolve @imports */
exports.getIncludePaths = fromFilename =>
  [
    PATHS.CWD,
    fromFilename.length && dirname(fromFilename),
    PATHS.MODULES,
  ].filter(Boolean)

exports.runTransformer = (name, options, { content, filename }) => {
  if (exports.isFn(options)) {
    return options({ content, filename })
  }

  try {
    if (!transformers[name]) {
      transformers[name] = require(`./transformers/${name}.js`)
    }

    return transformers[name]({ content, filename, options })
  } catch (e) {
    exports.throwError(`Error transforming '${name}'. Message:\n${e.message}`)
  }
}
