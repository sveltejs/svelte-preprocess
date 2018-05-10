const { readFileSync } = require('fs')
const { dirname, resolve } = require('path')
const stripIndent = require('strip-indent')

const { findPackageJson, getLanguage, runPreprocessor } = require('./utils.js')

const throwError = (msg) => { throw new Error(`[svelte-smart-preprocess] ${msg}`) }
const throwUnsupportedError = (lang, filename) =>
  throwError(`Unsupported script language '${lang}' in file '${filename}'`)

module.exports = (languages = {}) => {
  return {
    markup: ({content, filename}) => {
      const templateMatch = content.match(/(<template([\s\S]*?)>([\s\S]*?)<\/template>)/)

      /** If no <template> was found, just return the original markup */
      if (!templateMatch) {
        return { code: content }
      }

      let [, wholeTemplateTag, unparsedAttrs, templateCode] = templateMatch

      /** Transform the <template> attributes into a consumable object */
      unparsedAttrs = unparsedAttrs.trim()
      const attributes = unparsedAttrs.length > 0
        ? unparsedAttrs.split(' ').reduce((acc, entry) => {
          const [key, value] = entry.split('=')
          acc[key] = value.replace(/['"]/g, '')
          return acc
        }, {})
        : {}

      const lang = getLanguage(attributes, 'html')
      const componentDir = dirname(filename)

      /** If src="" is allowed and was defined, let's get the referenced file content */
      if (attributes.src) {
        templateCode = readFileSync(resolve(componentDir, attributes.src)).toString()
      }

      /** If language is HTML, just remove the <template></template> tags */
      if (lang === 'html') {
        return {
          code: content.replace(wholeTemplateTag, templateCode)
        }
      }

      if (languages[lang]) {
        const processedContent = runPreprocessor(lang,
          languages[lang],
          stripIndent(templateCode),
          filename
        )

        /** It may return a promise, let's check for that */
        if (Promise.resolve(processedContent) === processedContent) {
          return processedContent.then(({ code }) => {
            return {
              code: content.replace(wholeTemplateTag, code)
            }
          })
        }

        /** Remove the <template> tag with the actual template code */
        return {
          code: content.replace(wholeTemplateTag, processedContent.code)
        }
      }

      throwUnsupportedError(lang, filename)
    },
    script: ({ content = '', attributes, filename }) => {
      const lang = getLanguage(attributes, 'javascript')
      const componentDir = dirname(filename)

      /** If src="" is allowed and was defined, let's get the referenced file content */
      if (attributes.src) {
        content = readFileSync(resolve(componentDir, attributes.src)).toString()
      }

      if (lang === 'javascript') {
        return { code: content }
      }

      if (languages[lang]) {
        return runPreprocessor(lang, languages[lang], content, filename)
      }

      throwUnsupportedError(lang, filename)
    },
    style: ({ content = '', attributes, filename }) => {
      const lang = getLanguage(attributes, 'css')
      const componentDir = dirname(filename)

      /** If src="" is allowed and was defined, let's get the referenced file content */
      if (attributes.src) {
        content = readFileSync(resolve(componentDir, attributes.src)).toString()
      }

      if (lang === 'css') {
        return { code: content }
      }

      /** If the build step is supporting the used language, run it's preprocessor */
      if (languages[lang]) {
        return runPreprocessor(lang, languages[lang], content, filename)
      } else {
        throwUnsupportedError(lang, filename)
        /**
           * If including a uncompiled svelte component which uses a not supported style language,
           * search for it's package.json to see if there's a valid css file defined with 'svelte.style' or 'style'.
           * */
        const { data: pkgData, filename: pkgFilepath } = findPackageJson(
          componentDir
        )

        /** Found any package data? Is it a svelte component? */
        if (pkgData && pkgData.svelte) {
          const pkgDir = dirname(pkgFilepath)
          const svelteStyle = pkgData['svelte.style'] || pkgData.style

          /**
             * If there's a valid style definition, get the defined file's content.
             *
             * TODO - This is broken when the css has global styles. Disabled for now.
             * */
            if (false && svelteStyle) { // eslint-disable-line
            // log(
            //   'info',
            //   `Using precompiled css (${svelteStyle}) in component "${
            //     pkgData.name
            //   }"`
            // )
            content = readFileSync(resolve(pkgDir, svelteStyle))
              .toString()
              .replace(/\.svelte-\w{4,7}/, '')
          } else {
            throwUnsupportedError(lang, filename)
          }
        }
      }
    }
  }
}
