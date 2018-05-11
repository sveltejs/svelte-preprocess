const stripIndent = require('strip-indent')

const {
  getLanguage,
  runPreprocessor,
  isPromise,
  isFn,
  parseXMLAttrString,
  getSrcContent
} = require('./utils.js')

const throwError = (msg) => { throw new Error(`[svelte-smart-preprocess] ${msg}`) }
const throwUnsupportedError = (lang, filename) =>
  throwError(`Unsupported script language '${lang}' in file '${filename}'`)

const templateTagPattern = new RegExp('(<template([\\s\\S]*?)>([\\s\\S]*?)<\\/template>)')

module.exports = ({ style, script, markup, languages = {} } = {}) => {
  const getAssetPreprocessMethod = (targetLanguage, passthroughMethod) => {
    return ({ content = '', attributes, filename }) => {
      const lang = getLanguage(attributes, targetLanguage)
      let processedMap

      if (attributes.src) {
        content = getSrcContent(filename, attributes.src)
      }

      if (lang !== targetLanguage) {
        if (languages[lang] === false) {
          throwUnsupportedError(lang, filename)
        }

        const preProcessedContent = runPreprocessor(lang, languages[lang], content, filename)

        if (isPromise(preProcessedContent)) {
          /** If passthrough method is defined, wait for the promise to resolve and pass it to the method */
          if (isFn(passthroughMethod)) {
            return preProcessedContent.then(({ code, map }) => {
              return passthroughMethod({ content: code, attributes, filename })
            })
          }
          /** If no passthrough method, return the preprocess promise */
          return preProcessedContent
        }

        content = preProcessedContent.code
        processedMap = preProcessedContent.map
      }

      if (isFn(passthroughMethod)) {
        return passthroughMethod({ content, attributes, filename })
      }

      return { code: content, map: processedMap }
    }
  }

  return {
    script: getAssetPreprocessMethod('javascript', script),
    style: getAssetPreprocessMethod('css', style),
    markup: ({content, filename}) => {
      const templateMatch = content.match(templateTagPattern)

      /** If no <template> was found, just return the original markup */
      if (templateMatch) {
        let [, wholeTemplateTag, unparsedAttrs, templateCode] = templateMatch

        const attributes = parseXMLAttrString(unparsedAttrs)
        const lang = getLanguage(attributes, 'html')

        if (attributes.src) {
          templateCode = getSrcContent(filename, attributes.src)
        }

        /** If language is HTML, just remove the <template></template> tags */
        if (languages[lang] === false) {
          throwUnsupportedError(lang, filename)
        } else if (lang !== 'html') {
          const preProcessedContent = runPreprocessor(lang,
            languages[lang],
            stripIndent(templateCode),
            filename
          )

          /** It may return a promise, let's check for that */
          if (isPromise(preProcessedContent)) {
            return preProcessedContent.then(({ code }) => {
              content = content.replace(wholeTemplateTag, code)
              if (isFn(markup)) {
                return markup({ content, filename })
              }
              return { code: content }
            })
          }

          /** Replace the <template> tag with the actual template code */
          templateCode = preProcessedContent.code
        }

        content = content.replace(wholeTemplateTag, templateCode)
      }

      if (isFn(markup)) {
        return markup({ content, filename })
      }

      return { code: content }
    }
  }
}
