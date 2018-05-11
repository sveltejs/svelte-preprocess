const { existsSync, readFileSync } = require('fs')
const { resolve, dirname } = require('path')

exports.isFn = maybeFn => typeof maybeFn === 'function'

exports.isPromise = maybePromise => Promise.resolve(maybePromise) === maybePromise

exports.getSrcContent = (rootFile, path) => readFileSync(resolve(dirname(rootFile), path)).toString()

exports.parseXMLAttrString = unparsedAttrStr => {
  unparsedAttrStr = unparsedAttrStr.trim()
  return unparsedAttrStr.length > 0
    ? unparsedAttrStr.split(' ').reduce((acc, entry) => {
      const [key, value] = entry.split('=')
      acc[key] = value.replace(/['"]/g, '')
      return acc
    }, {})
    : {}
}

const LANG_DICT = new Map([
  ['sass', 'scss'],
  ['styl', 'stylus'],
  ['js', 'javascript'],
  ['coffee', 'coffeescript']
])

exports.getLanguage = (attributes, defaultLang) => {
  let lang

  if (attributes.src) {
    lang = attributes.src.match(/\.([^/.]+)$/)
    lang = lang ? lang[1] : defaultLang
  } else {
    lang = (attributes.type || attributes.lang || defaultLang).replace(
      'text/',
      ''
    )
  }

  return LANG_DICT.get(lang) || lang
}

const preprocessorModules = {}

exports.runPreprocessor = (lang, maybeFn, content, filename) => {
  if (typeof maybeFn === 'function') {
    return maybeFn(content, filename)
  }

  let preprocessOpts = {}

  if (maybeFn && maybeFn.constructor === Object) {
    preprocessOpts = maybeFn
  }

  try {
    preprocessorModules[lang] = preprocessorModules[lang] || require(`./langs/${lang}.js`)
    return preprocessorModules[lang](content, filename, preprocessOpts)
  } catch (e) {
    throw new Error(
      `[svelte-smart-preprocess] Error processing '${lang}'. Message:\n${
        e.message
      }`
    )
  }
}

exports.findPackageJson = function (startDir) {
  let dir
  let nextDir = startDir

  do {
    dir = nextDir
    const pkgfile = resolve(dir, 'package.json')

    if (existsSync(pkgfile)) {
      return {
        filename: pkgfile,
        data: JSON.parse(readFileSync(pkgfile))
      }
    }
    nextDir = resolve(dir, '..')
  } while (dir !== nextDir)

  return null
}
