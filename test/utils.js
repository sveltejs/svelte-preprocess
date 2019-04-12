const { readFileSync } = require('fs')
const { resolve } = require('path')
const {
  compile: svelteCompile,
  preprocess: sveltePreprocess,
} = require('svelte/compiler.js')

exports.CSS_PATTERN = /div(\.svelte-\w{4,7})?\s*\{\s*color:\s*(red|#f00);?\s*\}/

exports.preprocess = async (input, opts) =>
  sveltePreprocess(input, {
    filename: resolve(__dirname, 'App.svelte'),
    ...opts,
  })

const compile = async (input, magicOpts) => {
  const preprocessed = await exports.preprocess(input, magicOpts)
  const { js, css } = svelteCompile(preprocessed.toString(), {
    css: true,
  })

  return { js, css }
}

exports.doesCompileThrow = async (input, opts) => {
  let didThrow = false
  try {
    await compile(input, opts)
  } catch (err) {
    didThrow = true
  }
  return didThrow
}

exports.getFixturePath = file => resolve(__dirname, 'fixtures', file)

exports.getFixtureContent = file =>
  readFileSync(exports.getFixturePath(file))
    .toString()
    .trim()
