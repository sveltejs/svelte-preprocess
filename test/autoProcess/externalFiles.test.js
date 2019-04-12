const { resolve } = require('path')

const getAutoPreprocess = require('../../src')
const { preprocess, getFixtureContent, getFixturePath } = require('../utils.js')

const {
  markup: markupProcessor,
  script: scriptProcessor,
  style: styleProcessor,
} = getAutoPreprocess()

const getBaseObj = src => ({
  content: `<template src="./fixtures/template.html"></template>
  <style src="./fixtures/style.css"></style>
  <script src="./fixtures/script.js"></script>`,
  filename: resolve(__dirname, '..', 'App.svelte'),
  attributes: { src: `./fixtures/${src}` },
})

let markup, script, style

describe('external files', () => {
  beforeAll(async () => {
    ;[markup, script, style] = [
      await markupProcessor(getBaseObj('template.html')),
      await scriptProcessor(getBaseObj('script.js')),
      await styleProcessor(getBaseObj('style.css')),
    ]
  })

  it('should insert external file content', async () => {
    expect(markup.code).toContain(getFixtureContent('template.html'))
    expect(script.code).toContain(getFixtureContent('script.js'))
    expect(style.code).toContain(getFixtureContent('style.css'))
  })

  it('should add a external file as a dependency', async () => {
    expect(markup.dependencies).toContain(getFixturePath('template.html'))
    expect(script.dependencies).toContain(getFixturePath('script.js'))
    expect(style.dependencies).toContain(getFixturePath('style.css'))
  })

  const EXTERNALJS = [
    'https://www.example.com/some/externally/delivered/content.js',
    'http://www.example.com/some/externally/delivered/content.js',
    '//www.example.com/some/externally/delivered/content.js',
  ]

  EXTERNALJS.forEach(url => {
    it(`should not attempt to locally resolve ${url}`, async () => {
      const input = `<div></div><script src="${url}"></script>`

      const preprocessed = await preprocess(input, getAutoPreprocess())
      expect(preprocessed.toString()).toContain(input)
      expect(preprocessed.dependencies.length).toBe(0)
    })
  })
})
