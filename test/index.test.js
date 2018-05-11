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

describe('preprocessors', () => {
  it('should throw parsing pug when { pug: false }', async () => {
    const input = `<template lang="pug">
    div Hey
    </template>
    `
    const opts = magicalPreprocess({ languages: { pug: false } })
    expect(await doesThrow(input, opts)).toBe(true)
  })

  it('should parse pug', async () => {
    const input = `<template lang="pug">
div Hey
</template>
  `
    const opts = magicalPreprocess()
    const preprocessed = (await preprocess(input, opts)).trim()
    expect(preprocessed).toBe(parsedMarkup)
  })

  it('should parse external pug', async () => {
    const input = `<template src="./fixtures/template.pug"></template>`
    const opts = magicalPreprocess()
    expect(await preprocess(input, opts)).toBe(parsedMarkup)
  })

  it('should throw parsing scss when { scss: false }', async () => {
    const input = `
  <div></div>
  <style lang="scss">${getFixtureContent('style.scss')}</style>
  `
    const opts = magicalPreprocess({ languages: { scss: false } })
    expect(await doesThrow(input, opts)).toBe(true)
  })

  it('should parse scss', async () => {
    const input = `
  <div></div>
  <style lang="scss">${getFixtureContent('style.scss')}</style>
  `
    const opts = magicalPreprocess()
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should parse external scss', async () => {
    const input = `
  <div></div>
  <style src="./fixtures/style.scss"></style>
  `
    const opts = magicalPreprocess()
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should throw parsing less when { less: false }', async () => {
    const input = `
  <div></div>
  <style lang="less">${getFixtureContent('style.less')}</style>
  `
    const opts = magicalPreprocess({ languages: { less: false } })
    expect(await doesThrow(input, opts)).toBe(true)
  })

  it('should parse less', async () => {
    const input = `
  <div></div>
  <style lang="less">${getFixtureContent('style.less')}</style>
  `
    const opts = magicalPreprocess()
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should parse external less', async () => {
    const input = `
  <div></div>
  <style src="./fixtures/style.less"></style>
  `
    const opts = magicalPreprocess()
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should throw parsing stylus when { stylus: false }', async () => {
    const input = `
  <div></div>
  <style lang="styl">${getFixtureContent('style.styl')}</style>
  `
    const opts = magicalPreprocess({ languages: { stylus: false } })
    expect(await doesThrow(input, opts)).toBe(true)
  })

  it('should parse stylus', async () => {
    const input = `
  <div></div>
  <style lang="styl">${getFixtureContent('style.styl')}</style>
  `
    const opts = magicalPreprocess()
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should parse external stylus', async () => {
    const input = `
  <div></div>
  <style src="./fixtures/style.styl"></style>
  `
    const opts = magicalPreprocess()
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should throw parsing coffeescript when { coffeescript: false }', async () => {
    const input = `
  <div></div>
  <script src="./fixtures/script.coffee"></script>
  `
    const opts = magicalPreprocess({ languages: { coffeescript: false } })
    expect(await doesThrow(input, opts)).toBe(true)
  })

  it('should parse coffeescript', async () => {
    const input = `
  <div></div>
  <script lang="coffeescript">${getFixtureContent('script.coffee')}</script>
  `
    const opts = magicalPreprocess()
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed).toContain(parsedJs)
  })

  it('should parse external coffeescript', async () => {
    const input = `
  <div></div>
  <script src="./fixtures/script.coffee"></script>
  `
    const opts = magicalPreprocess()
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed).toContain(parsedJs)
  })
})

describe('options', () => {
  it('should accept custom preprocess method for a language', async () => {
    const input = `<template src="./fixtures/template.pug"></template>`
    const opts = magicalPreprocess({
      pug: (content, filename) => {
        const code = require('pug').render(content, opts)
        return { code }
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
      onBefore({ content }) {
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
