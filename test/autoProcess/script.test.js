const getAutoPreprocess = require('../../src')
const {
  preprocess,
  getFixtureContent,
  doesCompileThrow,
} = require('../utils.js')

const SCRIPT_LANGS = [['coffeescript', 'coffee']]
const EXPECTED_SCRIPT = getFixtureContent('script.js')

SCRIPT_LANGS.forEach(([lang, ext, langOptions]) => {
  describe(`script - preprocessor - ${lang}`, () => {
    const template = `<div></div><script lang="${lang}">${getFixtureContent(
      'script.' + ext,
    )}</script>`

    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const input = `
        <div></div>
        <script src="./fixtures/script.${ext}"></script>
      `
      const opts = getAutoPreprocess({
        transformers: {
          [lang]: false,
        },
      })
      expect(await doesCompileThrow(input, opts)).toBe(true)
    })

    it(`should parse ${lang}`, async () => {
      const opts = getAutoPreprocess()
      const preprocessed = await preprocess(template, opts)
      expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT)
    })
  })
})
