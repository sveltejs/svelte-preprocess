const autoProcess = require('../../src')
const { preprocess } = require('../utils.js')

describe('transformer - globalStyle', () => {
  it('should wrap selector in :global(...) modifier', async () => {
    const template = `<style global>div{color:red}</style>`
    const opts = autoProcess()
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.toString()).toContain(':global(div)')
  })
})
