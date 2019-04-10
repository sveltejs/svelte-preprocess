const { readFile } = require('fs')
const { resolve, dirname } = require('path')
const { processedMarkupAttrs } = require('../utils.js')

const TEMPLATE_PATTERN = new RegExp(
  `<template([\\s\\S]*?)>([\\s\\S]*?)<\\/template>`,
)

const parseAttributes = (attrsStr = '') =>
  attrsStr
    .split(/\s+/)
    .filter(Boolean)
    .reduce((acc, attr) => {
      const [name, value] = attr.split('=')
      acc[name] = value ? value.replace(/['"]/g, '') : true
      return acc
    }, {})

/** Resolve the path from a importee to a imported file */
const resolveSrc = (importerFile, srcPath) =>
  resolve(dirname(importerFile), srcPath)

/** Get the content of a file */
const getSrcContent = file => {
  return new Promise((resolve, reject) => {
    readFile(file, (error, data) => {
      if (error) reject(error)
      else resolve(data.toString())
    })
  })
}

/** Replace a regexp match with a value */
const sliceReplace = (match, str, replaceValue) =>
  (
    str.slice(0, match.index) +
    replaceValue +
    str.slice(match.index + match[0].length)
  ).trim()

const getAssetExternalSrc = async ({ content, attributes, filename }) => {
  if (
    !attributes ||
    !attributes.src ||
    attributes.src.match(/^(https?)?:?\/\/.*$/)
  ) {
    return { code: content }
  }

  const externalFilePath = resolveSrc(filename, attributes.src)

  content = await getSrcContent(resolveSrc(filename, attributes.src))
  const dependencies = [externalFilePath]

  return {
    code: content,
    dependencies,
  }
}

module.exports = () => ({
  async markup({ content, filename }) {
    let dependencies
    const templateMatch = content.match(TEMPLATE_PATTERN)

    /** If no <template> was found, just return the original markup */
    if (!templateMatch) {
      return { code: content }
    }

    let [, attributes, templateCode] = templateMatch

    attributes = parseAttributes(attributes)

    if (attributes.src) {
      const externalFilePath = resolveSrc(filename, attributes.src)
      templateCode = await getSrcContent(externalFilePath)
      dependencies = [externalFilePath]
    }

    processedMarkupAttrs[filename] = attributes

    /** If language is HTML, just remove the <template></template> tags */
    return {
      code: sliceReplace(templateMatch, content, templateCode),
      dependencies,
    }
  },
  style: getAssetExternalSrc,
  script: getAssetExternalSrc,
})
