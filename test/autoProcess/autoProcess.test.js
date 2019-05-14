const getAutoPreprocess = require('../../src')
const { getLanguage } = require('../../src/utils.js')

const {
  preprocess,
  getFixtureContent,
  doesCompileThrow,
  CSS_PATTERN,
} = require('../utils.js')

describe('detect - mimetype', () => {
  const MIMETYPES = [
    { type: 'application/ld+json', parser: 'ld+json' },
    { type: 'text/some-other', parser: 'some-other' },
    { lang: 'stylus', parser: 'stylus' },
    { src: '../foo.custom', lang: 'customLanguage', parser: 'customLanguage' },
  ]

  MIMETYPES.forEach(({ type, lang, src, parser }) => {
    it(`should detect '${src || type || lang}' as '${parser}'`, async () => {
      const language = getLanguage({ type, lang, src }, 'javascript')
      expect(language).toEqual({ lang: parser, alias: parser })
    })
  })
})

describe('options', () => {
  it('should accept custom method for a transformer', async () => {
    const input = `<template lang="customTransformer">${getFixtureContent(
      'template.custom',
    )}</template>`
    const opts = getAutoPreprocess({
      customTransformer({ content, filename }) {
        content = content
          .replace('foo', 'bar')
          .toString()
          .trim()
        return { code: content, map: null }
      },
    })
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed.toString()).toBe('bar')
  })

  it('should accept an options object as transformer value', async () => {
    const input = `<div></div><style src="./fixtures/style.scss"></style>`
    const preprocessed = await preprocess(
      input,
      getAutoPreprocess({
        scss: {
          sourceMap: false,
          includedPaths: ['node_modules'],
        },
      }),
    )
    expect(preprocessed.toString()).toMatch(CSS_PATTERN)
  })

  it('should execute a onBefore method before transforming markup', async () => {
    const input = `UPPERCASE?`
    const opts = getAutoPreprocess({
      async onBefore({ content }) {
        return content.toLowerCase()
      },
    })
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed.toString()).toBe(input.toLowerCase())
  })

  it('should append aliases to the language alias dictionary', async () => {
    const input = `<div></div><style lang="customLanguage"></style>`
    const opts = getAutoPreprocess({
      aliases: [['customLanguage', 'css']],
    })
    expect(await doesCompileThrow(input, opts)).toBe(false)
  })

  it('should NOT preprocess preserved languages', async () => {
    const input = `<div></div><script type="application/ld+json">{"json":true}</script>`
    const opts = getAutoPreprocess({
      preserve: ['ld+json'],
      aliases: [['ld+json', 'structuredData']],
      structuredData() {
        return { code: '', map: '' }
      },
    })
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed.toString()).toContain(
      `<script type="application/ld+json">{"json":true}</script>`,
    )
  })

  it('should allow to pass specific options to alias', async () => {
    const input = `<div></div><style lang="sass">${getFixtureContent(
      'style.sass',
    )}</style>`

    const opts = getAutoPreprocess({
      sass: {
        indentedSyntax: false,
      },
    })

    expect(await doesCompileThrow(input, opts)).toBe(true)
  })

  it('should support the old `transformers` option', async () => {
    const input = `<script lang="mock"></script>`
    const opts = getAutoPreprocess({
      transformers: {
        mock: () => ({ code: 'mock' }),
      },
    })
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed.toString()).toBe(`<script lang="mock">mock</script>`)
  })
})
