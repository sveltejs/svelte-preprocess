const { resolve } = require('path')
const getAutoPreprocess = require('../../src')
const { preprocess } = require('../utils.js')

describe('transformer - pug', () => {
  it('should correctly prepend mixins with TABS', async () => {
    const template = `<template lang="pug">
main
  header
    h1</template>`
    const opts = getAutoPreprocess()
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.code).toBe('<main><header><h1></h1></header></main>')
  })

  it('should correctly prepend mixins with TABS', async () => {
    const template = `<template lang="pug">
main
\theader
\t\th1</template>`
    const opts = getAutoPreprocess()
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.code).toBe('<main><header><h1></h1></header></main>')
  })
})
