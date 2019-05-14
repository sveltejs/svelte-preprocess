const stripIndent = require('strip-indent')
const {
  addLanguageAlias,
  getLanguage,
  runTransformer,
  isFn,
  getSrcContent,
  resolveSrc,
  throwUnsupportedError,
} = require('./utils.js')

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

  const getTransformerTo = targetLanguage => async ({
    content = '',
    attributes,
    filename,
  }) => {
    const { lang, alias } = getLanguage(attributes, targetLanguage)
    const dependencies = []

    if (preserve.includes(lang) || preserve.includes(alias)) {
      return
    }

    if (attributes.src) {
      /** Ignore remote files */
      if (attributes.src.match(/^(https?)?:?\/\/.*$/)) {
        return
      }
      const file = resolveSrc(filename, attributes.src)
      content = await getSrcContent(file)
      dependencies.push(file)
    }

    if (lang === targetLanguage) {
      return { code: content, dependencies }
    }

    if (transformers[lang] === false || transformers[alias] === false) {
      throwUnsupportedError(alias, filename)
    }

    const transformedContent = await runTransformer(
      lang,
      getTransformerOptions(lang, alias),
      {
        content: stripIndent(content),
        filename,
      },
    )

    return {
      ...transformedContent,
      dependencies,
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
          acc[name] = value ? value.replace(/['"]/g, '') : true
          return acc
        }, {})

      /** Remove the <template></template> */
      content =
        content.slice(0, templateMatch.index) +
        templateCode +
        content.slice(templateMatch.index + fullMatch.length)

      /** Remove extra indentation */
      content = stripIndent(content)

      /** If language is HTML, just remove the <template></template> tags */
      return markupTransformer({ content, attributes, filename })
    },
    script: scriptTransformer,
    async style(assetInfo) {
      let { code, map, dependencies } = await cssTransformer(assetInfo)

      if (transformers.postcss) {
        const result = await runTransformer('postcss', transformers.postcss, {
          content: code,
          map,
          filename: assetInfo.filename,
        })

        code = result.code
        map = result.map
        dependencies = dependencies.concat(result.dependencies)
      }

      return { code, map, dependencies }
    },
  }
}
