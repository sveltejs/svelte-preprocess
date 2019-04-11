const { readFileSync } = require('fs')
const { resolve } = require('path')
const {
  compile: svelteCompile,
  preprocess: sveltePreprocess,
} = require('svelte/compiler.js')

exports.preprocess = async (input, opts) => {
  const preprocessed = await sveltePreprocess(input, {
    filename: resolve(__dirname, 'App.svelte'),
    ...opts,
  })
  return preprocessed.toString()
}

exports.compile = async (input, magicOpts) => {
  const preprocessed = await exports.preprocess(input, magicOpts)
  const { js, css } = svelteCompile(preprocessed.toString(), {
    css: true,
  })

  return { js, css }
}

exports.doesCompileThrow = async (input, opts) => {
  let didThrow = false
  try {
    await exports.compile(input, opts)
  } catch (err) {
    didThrow = true
  }
  return didThrow
}

exports.getFixtureContent = file =>
  readFileSync(resolve(__dirname, 'fixtures', file))
    .toString()
    .trim()
