const { resolve } = require('path')
const getAutoPreprocess = require('../../dist')
const { preprocess } = require('../utils.js')

describe('transformer - less', () => {
  it('should return @imported files as dependencies', async () => {
    const template = `<style lang="less">@import "fixtures/style.less";</style>`
    const opts = getAutoPreprocess()
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'style.less'),
    )
  })
})
