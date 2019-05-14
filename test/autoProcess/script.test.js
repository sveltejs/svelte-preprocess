const getAutoPreprocess = require('../../src')
const {
  preprocess,
  getFixtureContent,
  doesCompileThrow,
} = require('../utils.js')

const SCRIPT_LANGS = [
  ['coffeescript', 'coffee'],
  ['typescript', 'ts', { compilerOptions: { module: 'es2015' } }],
]
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
        [lang]: false,
      })
      expect(await doesCompileThrow(input, opts)).toBe(true)
    })

    it(`should parse ${lang}`, async () => {
      const opts = getAutoPreprocess({
        [lang]: langOptions,
      })
      const preprocessed = await preprocess(template, opts)
      expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT)
    })
  })
})

describe('script - preprocessor - typescript', () => {
  const template = `<div></div><script lang="ts">${getFixtureContent(
    'script.ts',
  )}</script>`

  it('should work with no compilerOptions', async () => {
    const opts = getAutoPreprocess()
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.toString()).toContain('exports.hello')
  })

  it('should work with tsconfigDirectory', async () => {
    const opts = getAutoPreprocess({
      typescript: {
        tsconfigDirectory: './test/fixtures',
      },
    })
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT)
  })

  it('should work with tsconfigPath', async () => {
    const opts = getAutoPreprocess({
      typescript: {
        tsconfigPath: './test/fixtures/tsconfig.json',
      },
    })
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT)
  })

  it('should report syntactic errors in tsconfig file', () => {
    const opts = getAutoPreprocess({
      typescript: {
        tsconfigPath: './test/fixtures/tsconfig.syntactic.json',
      },
    })
    return expect(preprocess(template, opts)).rejects.toThrow('TS1005')
  })

  it('should report semantic errors in tsconfig file', () => {
    const opts = getAutoPreprocess({
      typescript: {
        tsconfigPath: './test/fixtures/tsconfig.semantic.json',
      },
    })
    return expect(preprocess(template, opts)).rejects.toThrow('TS6046')
  })
})
