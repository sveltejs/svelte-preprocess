const stripIndent = require('strip-indent')

const {
  addLanguageAlias,
  getLanguage,
  runTransformer,
  isFn,
  getSrcContent,
  resolveSrc,
  throwUnsupportedError,
  aliasOverrides,
} = require('./utils.js')
const vueLikeProcessor = require('./processors/vueLike.js')()

module.exports = ({
  onBefore,
  transformers = {},
  aliases,
  preserve = [],
} = {}) => {
  const optionsCache = {}

  if (aliases && aliases.length) {
    addLanguageAlias(aliases)
  }

  const getTransformerOpts = (lang, alias) => {
    if (isFn(transformers[alias])) return transformers[alias]
    if (isFn(transformers[lang])) return transformers[lang]

    if (typeof optionsCache[alias] === 'undefined') {
      let opts = transformers[lang] || {}

      if (lang !== alias) {
        opts = {
          ...opts,
          ...(aliasOverrides[alias] || {}),
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

    if (
      transformers[lang] === false ||
      (lang !== alias && transformers[alias] === false)
    ) {
      throwUnsupportedError(alias, filename)
    }

    const result = await runTransformer(lang, getTransformerOpts(lang, alias), {
      content: stripIndent(content),
      filename,
    })
    result.dependencies = dependencies
    return result
  }

  const cssTransformer = getTransformerTo('css')

  return {
    async markup({ content, filename }) {
      if (isFn(onBefore)) {
        content = await onBefore({ content, filename })
      }

      return vueLikeProcessor.markup({ content, filename })
    },
    script: getTransformerTo('javascript'),
    style: assetInfo => {
      const transformedCSS = cssTransformer(assetInfo)
      if (transformers.postcss) {
        return Promise.resolve(transformedCSS).then(({ code, map }) => {
          return runTransformer('postcss', transformers.postcss, {
            content: stripIndent(code),
            filename: assetInfo.filename,
            map,
          })
        })
      }

      return transformedCSS
    },
  }
}
