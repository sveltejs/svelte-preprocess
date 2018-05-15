const { readFileSync } = require('fs')
const { resolve, dirname } = require('path')

const LANG_DICT = new Map([
  ['postcss', 'css'],
  ['sass', 'scss'],
  ['styl', 'stylus'],
  ['js', 'javascript'],
  ['coffee', 'coffeescript'],
])

const cwd = process.cwd()
const paths = {
  cwd,
  modules: resolve(cwd, 'node_modules'),
}

/** Paths used by preprocessors to resolve @imports */
exports.getIncludePaths = fromFilename =>
  [
    paths.cwd,
    fromFilename.length && dirname(fromFilename),
    paths.modules,
  ].filter(Boolean)

exports.isFn = maybeFn => typeof maybeFn === 'function'

exports.getSrcContent = (rootFile, path) =>
  readFileSync(resolve(dirname(rootFile), path)).toString()

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

exports.addLanguageAlias = entries =>
  entries.forEach(entry => LANG_DICT.set(...entry))

exports.getLanguage = (attributes, defaultLang) => {
  let lang

  if (attributes.src) {
    lang = attributes.src.match(/\.([^/.]+)$/)
    lang = lang ? lang[1] : defaultLang
  } else {
    lang = attributes.type
      ? attributes.type.replace('text/', '')
      : attributes.lang || defaultLang
  }

  return LANG_DICT.get(lang) || lang
}

const transformers = {}

exports.runTransformer = (name, maybeFn, { content, filename }) => {
  if (exports.isFn(maybeFn)) {
    return maybeFn({ content, filename })
  }

  try {
    if (!transformers[name]) {
      transformers[name] = require(`./transformers/${name}.js`)
    }

    const options =
      maybeFn && maybeFn.constructor === Object ? maybeFn : undefined

    return transformers[name]({ content, filename, options })
  } catch (e) {
    throw new Error(
      `[svelte-preprocess] Error transforming '${name}'. Message:\n${
        e.message
      }`,
    )
  }
}
