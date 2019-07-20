const { readFile } = require('fs')
const { resolve, dirname, basename } = require('path')

const LANG_DICT = new Map([
  ['pcss', 'css'],
  ['postcss', 'css'],
  ['sass', 'scss'],
  ['styl', 'stylus'],
  ['js', 'javascript'],
  ['coffee', 'coffeescript'],
  ['ts', 'typescript'],
])

const throwError = msg => {
  throw new Error(`[svelte-preprocess] ${msg}`)
}

exports.concat = (...arrs) =>
  arrs.reduce((acc, a) => (a && a.length ? acc.concat(a) : acc), [])

exports.throwUnsupportedError = (lang, filename) =>
  throwError(`Unsupported script language '${lang}' in file '${filename}'`)

exports.isFn = maybeFn => typeof maybeFn === 'function'

const resolveSrc = (exports.resolveSrc = (importerFile, srcPath) =>
  resolve(dirname(importerFile), srcPath))

const getSrcContent = (exports.getSrcContent = file => {
  return new Promise((resolve, reject) => {
    readFile(file, (error, data) => {
      // istanbul ignore if
      if (error) reject(error)
      else resolve(data.toString())
    })
  })
})

exports.parseFile = async ({ attributes, filename, content }, language) => {
  const dependencies = []
  if (attributes.src) {
    /** Ignore remote files */
    if (!attributes.src.match(/^(https?)?:?\/\/.*$/)) {
      const file = resolveSrc(filename, attributes.src)
      content = await getSrcContent(file)
      dependencies.push(file)
    }
  }

  const { lang, alias } = exports.getLanguage(attributes, language)

  return {
    filename,
    attributes,
    content,
    lang,
    alias,
    dependencies,
  }
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
    lang = basename(attributes.src).split('.')
    lang = lang.length > 1 ? lang.pop() : defaultLang
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
    throwError(
      `Error transforming '${name}'. Message:\n${e.message}\nStack:\n${e.stack}`,
    )
  }
}

exports.requireAny = (...modules) => {
  for (let m of modules) {
    try {
      return require(m)
    } catch (e) {}
  }
  throw new Error(`Cannot find any of modules: ${modules}`)
}
