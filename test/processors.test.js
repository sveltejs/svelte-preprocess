const {
  scss,
  sass,
  less,
  stylus,
  postcss,
  coffeescript,
  typescript,
} = require('../src')
const { CSS_PATTERN, getFixtureContent, preprocess } = require('./utils.js')

const EXPECTED_SCRIPT = getFixtureContent('script.js')

const STYLE_LANGS = [
  ['sass', 'sass', sass],
  ['scss', 'scss', scss],
  ['less', 'less', less],
  ['stylus', 'styl', stylus],
  ['postcss', 'css', postcss],
]
const SCRIPT_LANGS = [
  ['coffeescript', 'coffee', coffeescript],
  ['typescript', 'ts', typescript, { compilerOptions: { module: 'es2015' } }],
]

STYLE_LANGS.forEach(([lang, ext, processor, options]) => {
  describe(`processor - ${lang}`, () => {
    it('should support external src files', async () => {
      const template = `<style src="./fixtures/style.${ext}"></style><div></div>`
      const preprocessed = await preprocess(template, [processor(options)])
      expect(preprocessed.toString()).toMatch(CSS_PATTERN)
    })
  })
})

SCRIPT_LANGS.forEach(([lang, ext, processor, options]) => {
  describe(`processor - ${lang}`, () => {
    it('should support external src files', async () => {
      const template = `<script src="./fixtures/script.${ext}"></script><div></div>`
      const preprocessed = await preprocess(template, [processor(options)])
      expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT)
    })
  })
})
