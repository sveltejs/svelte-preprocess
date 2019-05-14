const getAutoPreprocess = require('../../src')
const {
  preprocess,
  getFixtureContent,
  doesCompileThrow,
} = require('../utils.js')

const EXPECTED_MARKUP = getFixtureContent('template.html')
const MARKUP_LANGS = [['pug', 'pug']]

it('should parse HTML between <template></template>', async () => {
  const input = `<template><div>Hey</div></template>`
  const preprocessed = await preprocess(input, getAutoPreprocess())
  expect(preprocessed.toString()).toBe(EXPECTED_MARKUP)
})

MARKUP_LANGS.forEach(([lang, ext]) => {
  describe(`markup - preprocessor - ${lang}`, () => {
    const template = `<template lang="${lang}">${getFixtureContent(
      `template.${ext}`,
    )}</template>`

    it(`should throw parsing ${lang} when { ${lang}: false }`, async () => {
      const opts = getAutoPreprocess({ pug: false })
      expect(await doesCompileThrow(template, opts)).toBe(true)
    })

    it(`should parse ${lang}`, async () => {
      const preprocessed = (await preprocess(template, getAutoPreprocess()))
        .toString()
        .trim()
      expect(preprocessed.toString()).toBe(EXPECTED_MARKUP)
    })
  })
})
