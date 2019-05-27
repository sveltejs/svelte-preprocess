const ts = require('typescript')
const { dirname, resolve } = require('path')
const { existsSync } = require('fs')

function createFormatDiagnosticsHost(cwd) {
  return {
    getCanonicalFileName: fileName => fileName,
    getCurrentDirectory: () => cwd,
    getNewLine: () => ts.sys.newLine,
  }
}

function formatDiagnostics(diagnostics, basePath) {
  if (Array.isArray(diagnostics)) {
    return ts.formatDiagnosticsWithColorAndContext(
      diagnostics,
      createFormatDiagnosticsHost(basePath),
    )
  }
  return ts.formatDiagnostic(diagnostics, createFormatDiagnosticsHost(basePath))
}

function getFilenameExtension(filename) {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1) return ''
  return filename.substr(lastDotIndex + 1)
}

function isSvelteFile(filename) {
  const importExtension = getFilenameExtension(filename)
  return importExtension === 'svelte' || importExtension === 'html'
}

const IMPORTEE_PATTERN = /['"](.*?)['"]/
function isValidSvelteImportDiagnostic(filename, diagnostic) {
  // TS2307: 'cannot find module'
  if (diagnostic.code !== 2307) return false

  const importeeMatch = diagnostic.messageText.match(IMPORTEE_PATTERN)
  if (!importeeMatch) return false

  let [, importeePath] = importeeMatch
  /**
   * check if we're dealing with a relative path (begins with .)
   * and if it's a svelte file
   * */
  if (importeePath[0] !== '.' || !isSvelteFile(importeePath)) {
    return false
  }

  importeePath = resolve(dirname(filename), importeePath)
  if (existsSync(importeePath)) return true

  return false
}

const TS_TRANSFORMERS = {
  before: [
    context => {
      const visit = node => {
        if (ts.isImportDeclaration(node)) {
          const importedFilename = node.moduleSpecifier.getText().slice(1, -1)
          if (isSvelteFile(importedFilename)) {
            return ts.createImportDeclaration(
              node.decorators,
              node.modifiers,
              node.importClause,
              node.moduleSpecifier,
            )
          }
        }

        return ts.visitEachChild(node, child => visit(child), context)
      }

      return node => ts.visitNode(node, visit)
    },
  ],
}

function compileFileFromMemory(compilerOptions, { filename, content }) {
  let code = content
  let map

  const realHost = ts.createCompilerHost(compilerOptions, true)
  const dummyFilePath = filename
  const dummySourceFile = ts.createSourceFile(
    dummyFilePath,
    code,
    ts.ScriptTarget.Latest,
  )

  const host = {
    fileExists: filePath =>
      filePath === dummyFilePath || realHost.fileExists(filePath),
    directoryExists:
      realHost.directoryExists && realHost.directoryExists.bind(realHost),
    getCurrentDirectory: realHost.getCurrentDirectory.bind(realHost),
    getDirectories: realHost.getDirectories.bind(realHost),
    getCanonicalFileName: fileName => realHost.getCanonicalFileName(fileName),
    getNewLine: realHost.getNewLine.bind(realHost),
    getDefaultLibFileName: realHost.getDefaultLibFileName.bind(realHost),
    getSourceFile: (
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile,
    ) =>
      fileName === dummyFilePath
        ? dummySourceFile
        : realHost.getSourceFile(
            fileName,
            languageVersion,
            onError,
            shouldCreateNewSourceFile,
          ),
    readFile: filePath =>
      filePath === dummyFilePath ? content : realHost.readFile(filePath),
    useCaseSensitiveFileNames: () => realHost.useCaseSensitiveFileNames(),
    writeFile: (fileName, data) => {
      if (fileName.endsWith('.map')) {
        map = data
      } else {
        code = data
      }
    },
  }

  const program = ts.createProgram([dummyFilePath], compilerOptions, host)
  const emitResult = program.emit(
    undefined,
    undefined,
    undefined,
    undefined,
    TS_TRANSFORMERS,
  )

  // collect diagnostics without svelte import errors
  const diagnostics = [
    ...emitResult.diagnostics,
    ...ts.getPreEmitDiagnostics(program),
  ].reduce((acc, { file, ...diagnostic }) => {
    if (isValidSvelteImportDiagnostic(filename, diagnostic)) {
      return acc
    }

    acc.push({
      file,
      ...diagnostic,
    })

    return acc
  }, [])

  return { code, map, diagnostics }
}

module.exports = ({ content, filename, options }) => {
  const fileDirectory = options.tsconfigDirectory || dirname(filename)
  const tsconfigPath =
    options.tsconfigPath || ts.findConfigFile(fileDirectory, ts.sys.fileExists)
  const basePath = tsconfigPath ? dirname(tsconfigPath) : process.cwd()

  let compilerOptionsJSON = options.compilerOptions || {}
  if (tsconfigPath) {
    const { error, config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
    if (error) {
      throw new Error(formatDiagnostics(error, basePath))
    }

    compilerOptionsJSON = {
      moduleResolution: 'node',
      sourceMap: true,
      ...(config.compilerOptions || {}),
      ...compilerOptionsJSON,
    }
  }

  const {
    errors,
    options: convertedCompilerOptions,
  } = ts.convertCompilerOptionsFromJson(compilerOptionsJSON, basePath)
  if (errors.length) {
    throw new Error(formatDiagnostics(errors, basePath))
  }

  const compilerOptions = {
    ...convertedCompilerOptions,
    allowNonTsExtensions: true,
  }

  const { code, map, diagnostics } = compileFileFromMemory(compilerOptions, {
    filename,
    content,
  })

  if (diagnostics.length > 0) {
    const formattedDiagnostics = formatDiagnostics(diagnostics, basePath)
    console.log(formattedDiagnostics)
  }

  return {
    code,
    map,
    diagnostics,
  }
}
