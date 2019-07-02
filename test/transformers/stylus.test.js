const { resolve } = require('path')
const getAutoPreprocess = require('../../src')
const { preprocess } = require('../utils.js')

describe('transformer - stylus', () => {
  it('should return @imported files as dependencies', async () => {
    const template = `<style lang="stylus">@import "fixtures/style.styl";</style>`
    const opts = getAutoPreprocess()
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'style.styl'),
    )
  })
})
