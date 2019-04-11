const { readFile } = require('fs')
const { resolve, dirname } = require('path')

const LANG_DICT = new Map([
  ['postcss', 'css'],
  ['sass', 'scss'],
  ['styl', 'stylus'],
  ['js', 'javascript'],
  ['coffee', 'coffeescript'],
])

const throwError = msg => {
  throw new Error(`[svelte-preprocess] ${msg}`)
}

exports.throwUnsupportedError = (lang, filename) =>
  throwError(`Unsupported script language '${lang}' in file '${filename}'`)

exports.isFn = maybeFn => typeof maybeFn === 'function'

exports.resolveSrc = (importerFile, srcPath) =>
  resolve(dirname(importerFile), srcPath)

exports.getSrcContent = file => {
  return new Promise((resolve, reject) => {
    readFile(file, (error, data) => {
      if (error) reject(error)
      else resolve(data.toString())
    })
  })
}

exports.addLanguageAlias = entries =>
  entries.forEach(entry => LANG_DICT.set(...entry))

/** Paths used by preprocessors to resolve @imports */
exports.getIncludePaths = fromFilename =>
  [
    process.cwd(),
    fromFilename.length && dirname(fromFilename),
    resolve(process.cwd(), 'node_modules'),
  ].filter(Boolean)

exports.getLanguage = (attributes, defaultLang) => {
  let lang = defaultLang

  if (attributes.lang) {
    lang = attributes.lang
  } else if (attributes.type) {
    lang = attributes.type.replace(/^(text|application)\/(.*)$/, '$2')
  } else if (attributes.src) {
    lang = attributes.src.match(/\.([^/.]+)$/)
    lang = lang ? lang[1] : defaultLang
  }

  return {
    lang: LANG_DICT.get(lang) || lang,
    alias: lang,
  }
}

const TRANSFORMERS = {}

exports.runTransformer = (name, options, { content, filename }) => {
  if (exports.isFn(options)) {
    return options({ content, filename })
  }

  try {
    if (!TRANSFORMERS[name]) {
      TRANSFORMERS[name] = require(`./transformers/${name}.js`)
    }

    return TRANSFORMERS[name]({ content, filename, options })
  } catch (e) {
    throwError(`Error transforming '${name}'. Message:\n${e.message}`)
  }
}
