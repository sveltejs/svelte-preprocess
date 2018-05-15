const stripIndent = require('strip-indent')

const {
  addLanguageAlias,
  getLanguage,
  runTransformer,
  isFn,
  parseXMLAttrString,
  getSrcContent,
} = require('./utils.js')

const throwError = msg => {
  throw new Error(`[svelte-preprocess] ${msg}`)
}
const throwUnsupportedError = (lang, filename) =>
  throwError(`Unsupported script language '${lang}' in file '${filename}'`)

const templateTagPattern = new RegExp(
  '(<template([\\s\\S]*?)>([\\s\\S]*?)<\\/template>)',
)

module.exports = ({
  onBefore,
  transformers = {},
  aliases = undefined,
} = {}) => {
  if (aliases) {
    addLanguageAlias(aliases)
  }

  const getTransformerTo = targetLanguage => ({
    content = '',
    attributes,
    filename,
  }) => {
    const lang = getLanguage(attributes, targetLanguage)

    if (attributes.src) {
      content = getSrcContent(filename, attributes.src)
    }

    if (lang === targetLanguage) {
      return { code: content }
    }

    if (transformers[lang] === false) {
      throwUnsupportedError(lang, filename)
    }

    return runTransformer(lang, transformers[lang], {
      content: stripIndent(content),
      filename,
    })
  }

  const markupTransformer = ({ content, filename }) => {
    if (isFn(onBefore)) {
      content = onBefore({ content, filename })
    }

    const templateMatch = content.match(templateTagPattern)

    /** If no <template> was found, just return the original markup */
    if (!templateMatch) {
      return { code: content }
    }

    let [, wholeTemplateTag, unparsedAttrs, templateCode] = templateMatch

    const attributes = parseXMLAttrString(unparsedAttrs)
    const lang = getLanguage(attributes, 'html')

    if (attributes.src) {
      templateCode = getSrcContent(filename, attributes.src)
    }

    /** If language is HTML, just remove the <template></template> tags */
    if (lang === 'html') {
      return { code: content.replace(wholeTemplateTag, templateCode) }
    }

    if (transformers[lang] === false) {
      throwUnsupportedError(lang, filename)
    }

    const preProcessedContent = runTransformer(lang, transformers[lang], {
      content: stripIndent(templateCode),
      filename,
    })

    return Promise.resolve(preProcessedContent).then(({ code }) => {
      return {
        code: content.replace(wholeTemplateTag, code),
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
          content: code,
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
