const { readFileSync } = require('fs')
const { resolve } = require('path')
const svelte = require('svelte')
const magicalPreprocess = require('../src')

const getFixtureContent = (file) => readFileSync(resolve(__dirname, 'fixtures', file)).toString().trim()

const doesThrow = async (input, opts) => {
  let didThrow = false
  try {
    await preprocess(input, opts)
  } catch (err) {
    didThrow = err.message.includes('svelte-preprocess')
  }
  return didThrow
}

const cssRegExp = /div\.svelte-\w{4,7}\{color:(red|#f00)\}/
const parsedMarkup = getFixtureContent('template.html')
const parsedJs = getFixtureContent('script.js')

const preprocess = async (input, magicOpts) => {
  const preprocessed = await svelte.preprocess(input, {
    filename: resolve(__dirname, 'App.svelte'),
    ...magicOpts
  })
  return preprocessed.toString()
}

const compile = async (input, magicOpts) => {
  const preprocessed = await preprocess(input, magicOpts)
  const { js, css } = svelte.compile(preprocessed.toString(), {
    css: true
  })

  return { js, css }
}

const LANGS = {
  /** ['languageName', 'fixtureExtension'] */
  MARKUP: [
    ['pug', 'pug']
  ],
  SCRIPT: [
    ['coffeescript', 'coffee']
  ],
  STYLE: [
    ['less', 'less'],
    ['scss', 'scss'],
    ['stylus', 'styl']
  ]
}


describe('template tag', () => {
  it('should parse HTML between <template></template>', async () => {
    const input = `<template><div>Hey</div></template>`
    const opts = magicalPreprocess()
    expect(await preprocess(input, opts)).toBe(parsedMarkup)
  })

  it('should parse external HTML', async () => {
    const input = `<template src="./fixtures/template.html"></template>`
    const opts = magicalPreprocess()
    expect(await preprocess(input, opts)).toBe(parsedMarkup)
  })

  it('should parse external javascript', async () => {
    const input = `
      <div></div>
      <script src="./fixtures/script.js"></script>
    `
    const opts = magicalPreprocess()
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed).toContain(parsedJs)
  })

  it('should parse external css', async () => {
    const input = `
      <div></div>
      <style src="./fixtures/style.css"></style>
    `
    const opts = magicalPreprocess()
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })
})


LANGS.MARKUP.forEach(([lang, ext]) => {
  describe(`preprocessor - ${lang}`, () => {
    const template = `<template lang="${lang}">${getFixtureContent('template.' + ext)}</template>`
    const templateExternal = `<template src="./fixtures/template.${ext}"></template>`

    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const opts = magicalPreprocess({
        languages: {
          pug: false
        }
      })
      expect(await doesThrow(template, opts)).toBe(true)
    })

    it(`should parse ${lang}`, async () => {
      const opts = magicalPreprocess()
      const preprocessed = (await preprocess(template, opts)).trim()
      expect(preprocessed).toBe(parsedMarkup)
    })

    it(`should parse external ${lang}`, async () => {
      const opts = magicalPreprocess()
      expect(await preprocess(templateExternal, opts)).toBe(parsedMarkup)
    })
  })
})

LANGS.SCRIPT.forEach(([lang, ext]) => {
  describe(`preprocessor - ${lang}`, () => {

    const template = `
      <div></div>
      <script lang="${lang}">${getFixtureContent('script.' + ext)}</script>
    `

    const templateExternal = `
      <div></div>
      <script src="./fixtures/script.${ext}"></script>
    `

    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const input = `
        <div></div>
        <script src="./fixtures/script.${ext}"></script>
      `
      const opts = magicalPreprocess({
        languages: {
          [lang]: false
        }
      })
      expect(await doesThrow(input, opts)).toBe(true)
    })

    it(`should parse ${lang}`, async () => {
      const opts = magicalPreprocess()
      const preprocessed = await preprocess(template, opts)
      expect(preprocessed).toContain(parsedJs)
    })

    it(`should parse external ${lang}`, async () => {
      const opts = magicalPreprocess()
      const preprocessed = await preprocess(templateExternal, opts)
      expect(preprocessed).toContain(parsedJs)
    })
  })
})

LANGS.STYLE.forEach(([lang, ext]) => {
  describe(`preprocessor - ${lang}`, () => {
    const template = `
      <div></div>
      <style lang="${lang}">${getFixtureContent('style.' + ext)}</style>
    `

    const templateExternal = `
      <div></div>
      <style src="./fixtures/style.${ext}"></style>
    `

    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const opts = magicalPreprocess({
        languages: {
          [lang]: false
        }
      })
      expect(await doesThrow(template, opts)).toBe(true)
    })

    it(`should parse ${lang}`, async () => {
      const opts = magicalPreprocess()
      const compiled = await compile(template, opts)
      expect(compiled.css.code).toMatch(cssRegExp)
    })

    it(`should parse external ${lang}`, async () => {
      const opts = magicalPreprocess()
      const compiled = await compile(templateExternal, opts)
      expect(compiled.css.code).toMatch(cssRegExp)
    })
  })
})

describe('options', () => {
  it('should accept custom preprocess method for a language', async () => {
    const input = `<template src="./fixtures/template.pug"></template>`
    const opts = magicalPreprocess({
      pug: (content, filename) => {
        const code = require('pug').render(content, opts)
        return {
          code
        }
      }
    })
    const preprocessed = (await preprocess(input, opts)).trim()
    expect(preprocessed).toBe(parsedMarkup)
  })

  it('should accept an options object as language value', async () => {
    const input = `
    <div></div>
    <style src="./fixtures/style.scss"></style>
    `
    const opts = magicalPreprocess({
      scss: {
        includedPaths: ['node_modules']
      }
    })
    const compiled = (await compile(input, opts))
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should execute a onBefore method before preprocessing', async () => {
    const input = ``
    const opts = magicalPreprocess({
      onBefore({
        content
      }) {
        return '<template src="./fixtures/template.pug"></template>'
      }
    })
    const preprocessed = (await preprocess(input, opts)).trim()
    expect(preprocessed).toBe(parsedMarkup)
  })

  it('should append a custom language alias to the language alias dictionary', async () => {
    const input = `<div></div><style lang="customLanguage"></style>`
    const opts = magicalPreprocess({
      aliases: [
        ['customLanguage', 'css']
      ]
    })
    expect(await doesThrow(input, opts)).toBe(false)
  })
})