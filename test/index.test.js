const { readFileSync } = require('fs')
const { resolve } = require('path')
const svelte = require('svelte')
const smartPreprocess = require('../src')

const getFixtureContent = (file) => readFileSync(resolve(__dirname, 'fixtures', file)).toString().trim()

const doesThrow = async (input, opts) => {
  let didThrow = false
  try {
    await preprocess(input, opts)
  } catch (err) {
    didThrow = err.message.includes('svelte-smart-preprocess')
  }
  return didThrow
}

const cssRegExp = /div\.svelte-\w{4,7}\{color:(red|#f00)\}/
const parsedMarkup = getFixtureContent('template.html')
const parsedJs = getFixtureContent('script.js')

const preprocess = async (input, smartOpts) => {
  const preprocessed = await svelte.preprocess(input, {
    filename: resolve(__dirname, 'App.svelte'),
    ...smartOpts
  })
  return preprocessed.toString()
}

const compile = async (input, smartOpts) => {
  const preprocessed = await preprocess(input, smartOpts)
  const { js, css } = svelte.compile(preprocessed.toString(), {
    css: true
  })
  return { js, css }
}

describe('template tag', () => {
  it('should parse HTML between <template></template>', async () => {
    const input = `<template><div>Hey</div></template>`
    const opts = smartPreprocess()
    expect(await preprocess(input, opts)).toBe(parsedMarkup)
  })

  it('should parse external HTML', async () => {
    const input = `<template src="./fixtures/template.html"></template>`
    const opts = smartPreprocess()
    expect(await preprocess(input, opts)).toBe(parsedMarkup)
  })

  it('should parse external javascript', async () => {
    const input = `
    <div></div>
    <script src="./fixtures/script.js"></script>
    `
    const opts = smartPreprocess()
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed).toContain(parsedJs)
  })

  it('should parse external css', async () => {
    const input = `
  <div></div>
  <style src="./fixtures/style.css"></style>
  `
    const opts = smartPreprocess({ pug: true })
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })
})

describe('preprocessors', () => {
  it('should throw parsing pug when { pug: falsy }', async () => {
    const input = `
  <div></div>
  <style lang="pug">${getFixtureContent('template.pug')}</style>
  `
    const opts = smartPreprocess()
    expect(await doesThrow(input, opts)).toBe(true)
  })

  it('should parse pug', async () => {
    const input = `<template lang="pug">
div Hey
</template>
  `
    const opts = smartPreprocess({ pug: true })
    const preprocessed = (await preprocess(input, opts)).trim()
    expect(preprocessed).toBe(parsedMarkup)
  })

  it('should parse external pug', async () => {
    const input = `<template src="./fixtures/template.pug"></template>`
    const opts = smartPreprocess({ pug: true })
    expect(await preprocess(input, opts)).toBe(parsedMarkup)
  })

  it('should throw parsing scss when { scss: falsy }', async () => {
    const input = `
  <div></div>
  <style lang="scss">${getFixtureContent('style.scss')}</style>
  `
    const opts = smartPreprocess()
    expect(await doesThrow(input, opts)).toBe(true)
  })

  it('should parse scss', async () => {
    const input = `
  <div></div>
  <style lang="scss">${getFixtureContent('style.scss')}</style>
  `
    const opts = smartPreprocess({ scss: true })
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should parse external scss', async () => {
    const input = `
  <div></div>
  <style src="./fixtures/style.scss"></style>
  `
    const opts = smartPreprocess({ scss: true })
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should throw parsing less when { less: falsy }', async () => {
    const input = `
  <div></div>
  <style lang="less">${getFixtureContent('style.less')}</style>
  `
    const opts = smartPreprocess()
    expect(await doesThrow(input, opts)).toBe(true)
  })

  it('should parse less', async () => {
    const input = `
  <div></div>
  <style lang="less">${getFixtureContent('style.less')}</style>
  `
    const opts = smartPreprocess({ less: true })
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should parse external less', async () => {
    const input = `
  <div></div>
  <style src="./fixtures/style.less"></style>
  `
    const opts = smartPreprocess({ less: true })
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should throw parsing stylus when { stylus: falsy }', async () => {
    const input = `
  <div></div>
  <style lang="styl">${getFixtureContent('style.styl')}</style>
  `
    const opts = smartPreprocess()
    expect(await doesThrow(input, opts)).toBe(true)
  })

  it('should parse stylus', async () => {
    const input = `
  <div></div>
  <style lang="styl">${getFixtureContent('style.styl')}</style>
  `
    const opts = smartPreprocess({ stylus: true })
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should parse external stylus', async () => {
    const input = `
  <div></div>
  <style src="./fixtures/style.styl"></style>
  `
    const opts = smartPreprocess({ stylus: true })
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should throw parsing coffeescript when { coffeescript: falsy }', async () => {
    const input = `
  <div></div>
  <script src="./fixtures/script.coffee"></script>
  `
    const opts = smartPreprocess()
    expect(await doesThrow(input, opts)).toBe(true)
  })

  it('should parse coffeescript', async () => {
    const input = `
  <div></div>
  <script lang="coffeescript">${getFixtureContent('script.coffee')}</script>
  `
    const opts = smartPreprocess({ coffeescript: true })
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed).toContain(parsedJs)
  })

  it('should parse external coffeescript', async () => {
    const input = `
  <div></div>
  <script src="./fixtures/script.coffee"></script>
  `
    const opts = smartPreprocess({ coffeescript: true })
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed).toContain(parsedJs)
  })
})

describe('options', () => {
  it('should accept custom preprocess method for a language', async () => {
    const input = `<template src="./fixtures/template.pug"></template>
    `
    const opts = smartPreprocess({
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
    const opts = smartPreprocess({
      scss: {
        includedPaths: ['node_modules']
      }
    })
    const compiled = (await compile(input, opts))
    expect(compiled.css.code).toMatch(cssRegExp)
  })
})
