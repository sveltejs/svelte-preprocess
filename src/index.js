const stripIndent = require('strip-indent')

const {
  addLanguageAlias,
  getLanguage,
  runTransformer,
  isFn,
  parseAttributes,
  getSrcContent,
  throwUnsupportedError,
  getTagPattern,
  sliceReplace,
} = require('./utils.js')

const TEMPLATE_PATTERN = getTagPattern('template')

module.exports = ({ onBefore, transformers = {}, aliases } = {}) => {
  if (aliases && aliases.length) {
    addLanguageAlias(aliases)
  }

  const getTransformerOpts = (lang, alias) => {
    if (isFn(transformers[alias])) {
      return transformers[alias]
    }
    let opts = transformers[lang] || {}

    if (lang !== alias && typeof transformerOpts !== 'function') {
      opts = {
        ...opts,
        ...(transformers[alias] || {}),
      }
    }
    return opts
  }

  const getTransformerTo = targetLanguage => ({
    content = '',
    attributes,
    filename,
  }) => {
    const { lang, alias } = getLanguage(attributes, targetLanguage)

    if (attributes.src) {
      content = getSrcContent(filename, attributes.src)
    }

    if (lang === targetLanguage) {
      return {
        code: content,
      }
    }

    if (transformers[lang] === false) {
      throwUnsupportedError(alias, filename)
    }

    return runTransformer(lang, getTransformerOpts(lang, alias), {
      content: stripIndent(content),
      filename,
    })
  }

  const markupTransformer = ({ content, filename }) => {
    if (isFn(onBefore)) {
      content = onBefore({ content, filename })
    }

    const templateMatch = content.match(TEMPLATE_PATTERN)

    /** If no <template> was found, just return the original markup */
    if (!templateMatch) {
      return { code: content }
    }

    let [, attributes, templateCode] = templateMatch

    attributes = parseAttributes(attributes)
    const { lang, alias } = getLanguage(attributes, 'html')

    if (attributes.src) {
      templateCode = getSrcContent(filename, attributes.src)
    }

    /** If language is HTML, just remove the <template></template> tags */
    if (lang === 'html') {
      return {
        code: sliceReplace(templateMatch, content, templateCode),
      }
    }

    if (transformers[lang] === false) {
      throwUnsupportedError(lang, filename)
    }

    const preProcessedContent = runTransformer(
      lang,
      getTransformerOpts(lang, alias),
      {
        content: stripIndent(templateCode),
        filename,
      },
    )

    return Promise.resolve(preProcessedContent).then(({ code }) => {
      return {
        code: sliceReplace(templateMatch, content, code),
      }
    })
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
