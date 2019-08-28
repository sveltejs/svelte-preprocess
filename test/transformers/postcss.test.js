const { resolve } = require('path')
const getAutoPreprocess = require('../../src')
const { preprocess } = require('../utils.js')

describe('transformer - postcss', () => {
  it('should return @imported files as dependencies', async () => {
    const template = `<style>@import './fixtures/style.css';</style>`
    const opts = getAutoPreprocess({
      postcss: {
        plugins: [require('postcss-easy-import')],
      },
    })
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.dependencies).toContain(
      resolve(__dirname, '..', 'fixtures', 'style.css'),
    )
  })

  it('should allow custom postcss parsers', async () => {
    const template = `<style>
div
  color: red
</style>`
    const opts = getAutoPreprocess({
      postcss: {
        parser: require('sugarss'),
        plugins: [require('postcss-easy-import')],
      },
    })
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.toString()).toContain(`div {
  color: red
}`)
  })
})
