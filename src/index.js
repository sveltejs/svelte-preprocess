const stripIndent = require('strip-indent')

const {
  addLanguageAlias,
  getLanguage,
  runTransformer,
  isFn,
  parseAttributes,
  getSrcContent,
  resolveSrc,
  throwUnsupportedError,
  getTagPattern,
  sliceReplace,
  aliasOverrides,
} = require('./utils.js')

const TEMPLATE_PATTERN = getTagPattern('template')

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
      return {
        code: content,
        dependencies,
      }
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

  const markupTransformer = async ({ content, filename }) => {
    if (isFn(onBefore)) {
      content = await onBefore({ content, filename })
    }

    const templateMatch = content.match(TEMPLATE_PATTERN)

    /** If no <template> was found, just return the original markup */
    if (!templateMatch) {
      return { code: content }
    }

    let [, attributes, templateCode] = templateMatch

    attributes = parseAttributes(attributes)
    const { lang, alias } = getLanguage(attributes, 'html')
    const dependencies = []

    if (attributes.src) {
      const file = resolveSrc(filename, attributes.src)
      templateCode = await getSrcContent(file)
      dependencies.push(file)
    }

    /** If language is HTML, just remove the <template></template> tags */
    if (lang === 'html') {
      return {
        code: sliceReplace(templateMatch, content, templateCode),
        dependencies,
      }
    }

    if (transformers[lang] === false) {
      throwUnsupportedError(lang, filename)
    }

    const { code } = await runTransformer(
      lang,
      getTransformerOpts(lang, alias),
      {
        content: stripIndent(templateCode),
        filename,
      },
    )

    return {
      code: sliceReplace(templateMatch, content, code),
      dependencies,
    }
  }

  const scriptTransformer = getTransformerTo('javascript')
  const cssTransformer = getTransformerTo('css')
  const styleTransformer = assetInfo => {
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
  }

  return {
    markup: markupTransformer,
    script: scriptTransformer,
    style: styleTransformer,
  }
}
