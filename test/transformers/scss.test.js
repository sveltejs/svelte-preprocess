const getAutoPreprocess = require('../../dist')
const { preprocess } = require('../utils.js')

describe('transformer - scss', () => {
  it('should prepend scss content via `data` option property', async () => {
    const template = `<style lang="scss"></style>`
    const opts = getAutoPreprocess({
      scss: {
        data: '$color:red;div{color:$color}',
      },
    })
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.toString()).toContain('red')
  })
})
