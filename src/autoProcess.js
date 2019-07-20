const stripIndent = require('strip-indent')
const { version } = require('svelte/package.json')
const {
  concat,
  addLanguageAlias,
  parseFile,
  runTransformer,
  isFn,
  throwUnsupportedError,
} = require('./utils.js')

const SVELTE_MAJOR_VERSION = +version[0]

const ALIAS_OPTION_OVERRIDES = {
  sass: {
    indentedSyntax: true,
  },
}

const TEMPLATE_PATTERN = new RegExp(
  `<template([\\s\\S]*?)>([\\s\\S]*?)<\\/template>`,
)

module.exports = ({ onBefore, aliases, preserve = [], ...rest } = {}) => {
  const optionsCache = {}
  const transformers = rest.transformers || rest

  const getTransformerOptions = (lang, alias) => {
    if (isFn(transformers[alias])) return transformers[alias]
    if (isFn(transformers[lang])) return transformers[lang]

    // istanbul ignore else
    if (typeof optionsCache[alias] === 'undefined') {
      let opts = transformers[lang] || {}

      if (lang !== alias) {
        opts = {
          ...opts,
          ...(ALIAS_OPTION_OVERRIDES[alias] || {}),
          ...(transformers[alias] || {}),
        }
      }

      optionsCache[alias] = opts
    }

    return optionsCache[alias]
  }

  const getTransformerTo = targetLanguage => async svelteFile => {
    const { content, filename, lang, alias, dependencies } = await parseFile(
      svelteFile,
      targetLanguage,
    )

    if (preserve.includes(lang) || preserve.includes(alias)) {
      return
    }

    if (lang === targetLanguage) {
      return { code: content, dependencies }
    }

    if (transformers[lang] === false || transformers[alias] === false) {
      throwUnsupportedError(alias, filename)
    }

    const transformed = await runTransformer(
      lang,
      getTransformerOptions(lang, alias),
      { content: stripIndent(content), filename },
    )

    return {
      ...transformed,
      dependencies: concat(dependencies, transformed.dependencies),
    }
  }

  if (aliases && aliases.length) {
    addLanguageAlias(aliases)
  }

  const scriptTransformer = getTransformerTo('javascript')
  const cssTransformer = getTransformerTo('css')
  const markupTransformer = getTransformerTo('html')

  return {
    async markup({ content, filename }) {
      if (isFn(onBefore)) {
        // istanbul ignore next
        if (SVELTE_MAJOR_VERSION >= 3) {
          console.warn(
            '[svelte-preprocess] For svelte >= v3, instead of onBefore(), prefer to prepend a preprocess object to your array of preprocessors',
          )
        }
        content = await onBefore({ content, filename })
      }

      const templateMatch = content.match(TEMPLATE_PATTERN)

      /** If no <template> was found, just return the original markup */
      if (!templateMatch) {
        return { code: content }
      }

      const [fullMatch, attributesStr, templateCode] = templateMatch

      /** Transform an attribute string into a key-value object */
      const attributes = attributesStr
        .split(/\s+/)
        .filter(Boolean)
        .reduce((acc, attr) => {
          const [name, value] = attr.split('=')
          // istanbul ignore next
          acc[name] = value ? value.replace(/['"]/g, '') : true
          return acc
        }, {})

      /** Transform the found template code */
      let { code, map, dependencies } = await markupTransformer({
        content: templateCode,
        attributes,
        filename,
      })

      code =
        content.slice(0, templateMatch.index) +
        code +
        content.slice(templateMatch.index + fullMatch.length)

      return { code, map, dependencies }
    },
    script: scriptTransformer,
    async style({ content, attributes, filename }) {
      let { code, map, dependencies } = await cssTransformer({
        content,
        attributes,
        filename,
      })

      if (transformers.postcss) {
        const transformed = await runTransformer(
          'postcss',
          transformers.postcss,
          { content: code, map, filename },
        )

        code = transformed.code
        map = transformed.map
        dependencies = concat(dependencies, transformed.dependencies)
      }

      if (attributes.global) {
        const transformed = await runTransformer('globalStyle', null, {
          content: code,
          map,
          filename,
        })

        code = transformed.code
        map = transformed.map
      }

      return { code, map, dependencies }
    },
  }
}
