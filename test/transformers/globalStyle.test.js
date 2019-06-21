const autoProcess = require('../../src')
const { preprocess } = require('../utils.js')

describe('transformer - globalStyle', () => {
  it('should wrap selector in :global(...) modifier', async () => {
    const template = `<style global>@media(min-width:10px){div{color:red}}.test{}</style>`
    const opts = autoProcess()
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.toString()).toContain(
      '@media(min-width:10px){:global(div){color:red}}:global(.test){}',
    )
  })
  it('should wrap selector in :global(...) only if needed', async () => {
    const template = `<style global>
.test{}:global(.foo){}
@keyframes a {from{} to{}}
    </style>`
    const opts = autoProcess()
    const preprocessed = await preprocess(template, opts)
    expect(preprocessed.toString()).toContain(
      `:global(.test){}:global(.foo){}
@keyframes a {from{} to{}}`,
    )
  })
})
