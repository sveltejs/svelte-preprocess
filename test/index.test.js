const { readFileSync } = require('fs')
const { resolve } = require('path')
const {
  compile: svelteCompile,
  preprocess: sveltePreprocess,
} = require('svelte/compiler.js')
const getPreprocess = require('../src')
const { getLanguage } = require('../src/utils.js')

const getFixtureContent = file =>
  readFileSync(resolve(__dirname, 'fixtures', file))
    .toString()
    .trim()

const doesThrow = async (input, opts) => {
  let didThrow = false
  try {
    await compile(input, opts)
  } catch (err) {
    didThrow = true
  }
  return didThrow
}

const cssRegExp = /div\.svelte-\w{4,7}\{color:(red|#f00)\}/
const parsedMarkup = getFixtureContent('template.html')
const parsedJs = getFixtureContent('script.js')

const preprocess = async (input, magicOpts) => {
  const preprocessed = await sveltePreprocess(input, {
    filename: resolve(__dirname, 'App.svelte'),
    ...magicOpts,
  })
  return preprocessed.toString()
}

const compile = async (input, magicOpts) => {
  const preprocessed = await preprocess(input, magicOpts)
  const { js, css } = svelteCompile(preprocessed.toString(), {
    css: true,
  })

  return {
    js,
    css,
  }
}

const LANGS = {
  /** ['languageName', 'fixtureExtension'] */
  MARKUP: [['pug', 'pug']],
  SCRIPT: [['coffeescript', 'coffee']],
  STYLE: [
    ['sass', 'sass'],
    ['less', 'less'],
    ['scss', 'scss'],
    ['stylus', 'styl'],
  ],
}

describe('template tag', () => {
  it('should parse HTML between <template></template>', async () => {
    const input = `<template><div>Hey</div></template>`
    const opts = getPreprocess()
    expect(await preprocess(input, opts)).toBe(parsedMarkup)
  })

  it('should parse external HTML', async () => {
    const input = `<template src="./fixtures/template.html"></template>`
    const opts = getPreprocess()
    expect(await preprocess(input, opts)).toBe(parsedMarkup)
  })

  it('should parse external javascript', async () => {
    const input = `
      <div></div>
      <script src="./fixtures/script.js"></script>
    `
    const opts = getPreprocess()
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed).toContain(parsedJs)
  })

  it('should parse external css', async () => {
    const input = `
      <div></div>
      <style src="./fixtures/style.css"></style>
    `
    const opts = getPreprocess()
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })
})

LANGS.MARKUP.forEach(([lang, ext, langOptions]) => {
  describe(`markup - preprocessor - ${lang}`, () => {
    const template = `<template lang="${lang}">${getFixtureContent(
      'template.' + ext,
    )}</template>`
    const templateExternal = `<template src="./fixtures/template.${ext}"></template>`

    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const opts = getPreprocess({
        transformers: {
          pug: false,
        },
      })
      expect(await doesThrow(template, opts)).toBe(true)
    })

    it(`should parse ${lang}`, async () => {
      const opts = getPreprocess()
      const preprocessed = (await preprocess(template, opts)).trim()
      expect(preprocessed).toBe(parsedMarkup)
    })

    it(`should parse external ${lang}`, async () => {
      const opts = getPreprocess()
      expect(await preprocess(templateExternal, opts)).toBe(parsedMarkup)
    })
  })
})

LANGS.SCRIPT.forEach(([lang, ext, langOptions]) => {
  describe(`script - preprocessor - ${lang}`, () => {
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
      const opts = getPreprocess({
        transformers: {
          [lang]: false,
        },
      })
      expect(await doesThrow(input, opts)).toBe(true)
    })

    it(`should parse ${lang}`, async () => {
      const opts = getPreprocess()
      const preprocessed = await preprocess(template, opts)
      expect(preprocessed).toContain(parsedJs)
    })

    it(`should parse external ${lang}`, async () => {
      const opts = getPreprocess()
      const preprocessed = await preprocess(templateExternal, opts)
      expect(preprocessed).toContain(parsedJs)
    })
  })
})

LANGS.STYLE.forEach(([lang, ext, langOptions]) => {
  describe(`style - preprocessor - ${lang}`, () => {
    const template = `
      <div></div>
      <style lang="${lang}">${getFixtureContent('style.' + ext)}</style>
    `

    const templateExternal = `
      <div></div>
      <style src="./fixtures/style.${ext}"></style>
    `

    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const opts = getPreprocess({
        transformers: {
          [lang]: false,
        },
      })
      expect(await doesThrow(template, opts)).toBe(true)
    })

    it(`should parse ${lang}`, async () => {
      const opts = getPreprocess()
      const compiled = await compile(template, opts)
      expect(compiled.css.code).toMatch(cssRegExp)
    })

    it(`should parse external ${lang}`, async () => {
      const opts = getPreprocess()
      const compiled = await compile(templateExternal, opts)
      expect(compiled.css.code).toMatch(cssRegExp)
    })
  })
})

describe('style - postcss', () => {
  const template = `<div></div><style>div{appearance:none;}</style>`
  const templateExternal = `<div></div><style src="./fixtures/style.css"></style>`
  const templateSass = `<div></div><style lang="scss">div{appearance:none;}</style>`
  const optsTrue = getPreprocess({
    transformers: {
      postcss: true,
    },
  })
  const optsWithoutConfigFile = getPreprocess({
    transformers: {
      postcss: {
        plugins: [
          require('autoprefixer')({
            browsers: 'Safari >= 5.1',
          }),
        ],
      },
    },
  })
  const optsWithConfigFile = getPreprocess({
    transformers: {
      postcss: {
        configFilePath: './test/fixtures/',
      },
    },
  })

  it('should parse text/postcss and lang="postcss" as css', async () => {
    expect(getLanguage({ type: 'text/postcss' }, 'css')).toEqual({
      lang: 'css',
      alias: 'postcss',
    })
    expect(getLanguage({ lang: 'postcss' }, 'css')).toEqual({
      lang: 'css',
      alias: 'postcss',
    })
  })

  it('should not transform plain css with postcss if { postcss: falsy }', async () => {
    const compiled = await compile(template, getPreprocess())
    expect(compiled.css.code).not.toMatch(/-webkit-/)
  })

  it('should not transform plain css with postcss if { postcss: true } and no configuration file at cwd', async () => {
    const compiled = await compile(templateExternal, optsTrue)
    expect(compiled.css.code).toMatch(cssRegExp)
    expect(compiled.css.code).not.toMatch(/-webkit-/)
  })

  it('should transform plain css with postcss if { postcss: { plugins... } }', async () => {
    const compiled = await compile(template, optsWithoutConfigFile)
    expect(compiled.css.code).toMatch(/-webkit-/)
  })

  it('should transform async preprocessed css with postcss if { postcss: { plugins... } }', async () => {
    const compiled = await compile(templateSass, optsWithoutConfigFile)
    expect(compiled.css.code).toMatch(/-webkit-/)
  })

  it('should transform plain css with postcss if { postcss: { configFilePath: ... } }', async () => {
    const compiled = await compile(template, optsWithConfigFile)
    expect(compiled.css.code).toMatch(/-webkit-/)
  })
})

describe('detect - mimetype', () => {
  const MIMETYPES = [
    { type: 'application/ld+json', parser: 'ld+json' },
    { type: 'text/some-other', parser: 'some-other' },
    { lang: 'stylus', parser: 'stylus' },
    { src: '../foo.custom', lang: 'customLanguage', parser: 'customLanguage' },
  ]
  MIMETYPES.forEach(({ type, lang, src, parser }) => {
    it(`should detect '${src || type || lang}' as '${parser}'`, async () => {
      expect(getLanguage({ type, lang, src }, 'javascript')).toEqual({
        lang: parser,
        alias: parser,
      })
    })
  })
})

describe('external files', () => {
  it('should add a external file as a dependency', async () => {
    const content = `
    <template src="./fixtures/template.html"></template>
    <style src="./fixtures/style.css"></style>
    <script src="./fixtures/script.js"></script>
  `

    const getBaseObj = src => ({
      content,
      filename: resolve(__dirname, 'App.svelte'),
      attributes: { src: `./fixtures/${src}` },
    })

    const { markup, script, style } = getPreprocess()
    const [markupResult, scriptResult, styleResult] = [
      await markup(getBaseObj('template.html')),
      await script(getBaseObj('script.js')),
      await style(getBaseObj('style.css')),
    ]

    expect(markupResult.dependencies).toContain(
      resolve(__dirname, './fixtures/template.html'),
    )

    expect(scriptResult.dependencies).toContain(
      resolve(__dirname, './fixtures/script.js'),
    )

    expect(styleResult.dependencies).toContain(
      resolve(__dirname, './fixtures/style.css'),
    )
  })

  const EXTERNALJS = [
    'https://www.example.com/some/externally/delivered/content.js',
    'http://www.example.com/some/externally/delivered/content.js',
    '//www.example.com/some/externally/delivered/content.js',
  ]

  EXTERNALJS.forEach(url => {
    it(`should not attempt to locally resolve ${url}`, async () => {
      const input = `
      <div></div>
      <script src="${url}"></script>
      `

      const opts = getPreprocess()
      const preprocessed = await preprocess(input, opts)
      expect(preprocessed).toContain(input)
    })
  })
})

describe('options', () => {
  it('should accept custom method for a transformer', async () => {
    const input = `<template lang="customTransformer">${getFixtureContent(
      'template.custom',
    )}</template>`
    const opts = getPreprocess({
      transformers: {
        customTransformer({ content, filename }) {
          content = content.replace('foo', 'bar')
          return { code: content, map: null }
        },
      },
    })
    const preprocessed = (await preprocess(input, opts)).trim()
    expect(preprocessed).toBe('bar')
  })

  it('should accept an options object as transformer value', async () => {
    const input = `
    <div></div>
    <style src="./fixtures/style.scss"></style>
    `
    const opts = getPreprocess({
      transformers: {
        scss: {
          sourceMap: false,
          includedPaths: ['node_modules'],
        },
      },
    })
    const compiled = await compile(input, opts)
    expect(compiled.css.code).toMatch(cssRegExp)
  })

  it('should execute a onBefore method before transforming markup', async () => {
    const input = `what`
    const opts = getPreprocess({
      onBefore({ content }) {
        return content.replace(
          'what',
          '<template src="./fixtures/template.pug"></template>',
        )
      },
    })
    const preprocessed = (await preprocess(input, opts)).trim()
    expect(preprocessed).toBe(parsedMarkup)
  })

  it('should execute a async onBefore method before transforming markup', async () => {
    const input = `what`
    const opts = getPreprocess({
      onBefore({ content }) {
        return new Promise(resolve => {
          resolve(
            content.replace(
              'what',
              '<template src="./fixtures/template.pug"></template>',
            ),
          )
        })
      },
    })
    const preprocessed = (await preprocess(input, opts)).trim()
    expect(preprocessed).toBe(parsedMarkup)
  })

  it('should append aliases to the language alias dictionary', async () => {
    const input = `<div></div><style lang="customLanguage"></style>`
    const opts = getPreprocess({
      aliases: [['customLanguage', 'css']],
    })
    expect(await doesThrow(input, opts)).toBe(false)
  })

  it('should not preprocess preserved languages', async () => {
    const input = `<div></div><script type="application/ld+json">{"json":true}</script>`
    const opts = getPreprocess({
      transformers: {
        structuredData({ content }) {
          return { code: content, map: '' }
        },
      },
      aliases: [['ld+json', 'structuredData']],
    })
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed).toContain(`{"json":true}`)
  })

  it('should support custom language transformers', async () => {
    const input = `<div></div><script type="application/ld+json">{"json":true}</script>`
    const opts = getPreprocess({
      preserve: ['ld+json'],
      transformers: {
        structuredData({ content }) {
          return { code: content, map: '' }
        },
      },
    })
    const preprocessed = await preprocess(input, opts)
    expect(preprocessed).toContain(
      `<script type="application/ld+json">{"json":true}</script>`,
    )
  })

  it('should allow to pass specific options to alias', async () => {
    const input = `
      <div></div>
      <style lang="sass">${getFixtureContent('style.sass')}</style>
    `

    const opts = getPreprocess({
      transformers: {
        sass: {
          indentedSyntax: false,
        },
      },
    })

    expect(await doesThrow(input, opts)).toBe(true)
  })
})
