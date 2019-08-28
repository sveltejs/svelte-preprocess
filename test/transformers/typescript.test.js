const { resolve } = require('path')
const getAutoPreprocess = require('../../src')
const { preprocess, getFixtureContent } = require('../utils.js')

const EXPECTED_SCRIPT = getFixtureContent('script.js')

const transpile = async content => {
  const opts = getAutoPreprocess({
    typescript: {
      compilerOptions: {
        skipLibCheck: true,
      },
    },
  })

  return opts.script({
    content,
    attributes: { type: 'text/typescript' },
    filename: resolve(__dirname, '..', 'App.svelte'),
  })
}

describe('transformer - typescript', () => {
  const template = `<div></div><script lang="ts">${getFixtureContent(
    'script.ts',
  )}</script>`

  describe('configuration file', () => {
    it('should work with no compilerOptions', async () => {
      const opts = getAutoPreprocess()
      const preprocessed = await preprocess(template, opts)
      expect(preprocessed.toString()).toContain('exports.hello')
    })

    it('should work with tsconfigDirectory', async () => {
      const opts = getAutoPreprocess({
        typescript: {
          tsconfigDirectory: './test/fixtures',
        },
      })
      const preprocessed = await preprocess(template, opts)
      expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT)
    })

    it('should work with tsconfigFile', async () => {
      const opts = getAutoPreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.json',
        },
      })
      const preprocessed = await preprocess(template, opts)
      expect(preprocessed.toString()).toContain(EXPECTED_SCRIPT)
    })

    it('should report config syntactic errors in tsconfig file', () => {
      const opts = getAutoPreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.syntactic.json',
        },
      })
      return expect(preprocess(template, opts)).rejects.toThrow('TS1005')
    })

    it('should report config semantic errors in tsconfig file', () => {
      const opts = getAutoPreprocess({
        typescript: {
          tsconfigFile: './test/fixtures/tsconfig.semantic.json',
        },
      })
      return expect(preprocess(template, opts)).rejects.toThrow('TS6046')
    })

    it('should not type check if "transpileOnly: true"', async () => {
      const opts = getAutoPreprocess({
        typescript: {
          transpileOnly: true,
          compilerOptions: {
            module: 'ESNext',
          },
        },
      })
      const { code } = await preprocess(template, opts)
      return expect(code).toContain(getFixtureContent('script.js'))
    })
  })

  describe('code errors', () => {
    it('should report semantic errors in template', async () => {
      const { diagnostics } = await transpile('let label:string = 10')
      expect(diagnostics.some(d => d.code === 2322)).toBe(true)
    })

    it('should report invalid relative svelte import statements', async () => {
      const { diagnostics } = await transpile(
        `import Nested from './fixtures/NonExistent.svelte'`,
      )
      expect(diagnostics.some(d => d.code === 2307)).toBe(true)
    })

    it('should NOT report valid relative svelte import statements', async () => {
      const { diagnostics } = await transpile(
        `import Nested from './fixtures/Nested.svelte'`,
      )
      expect(diagnostics.some(d => d.code === 2307)).toBe(false)
    })

    it('should NOT report non-relative svelte import statements', async () => {
      const { diagnostics } = await transpile(
        `import Nested from 'svelte/FakeSvelte.svelte'`,
      )
      expect(diagnostics.some(d => d.code === 2307)).toBe(false)
    })

    it('should NOT affect non-svelte import statement', async () => {
      const { diagnostics } = await transpile(
        `import Nested from './relative/yaddaYadda.js'`,
      )
      expect(diagnostics.some(d => d.code === 2307)).toBe(true)
    })

    it('should NOT affect import statement without file extension', async () => {
      const { diagnostics } = await transpile(
        `import Nested from './relative/noExtension'`,
      )
      expect(diagnostics.some(d => d.code === 2307)).toBe(true)
    })
  })
})
