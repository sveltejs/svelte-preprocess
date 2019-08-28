const ts = require('typescript')
const { dirname, basename, resolve } = require('path')
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
  filename = basename(filename)
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex <= 0) return ''
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
  // istanbul ignore if
  if (!importeeMatch) return false

  let [, importeePath] = importeeMatch
  /** if we're not dealing with a relative path, assume the file exists */
  if (importeePath[0] !== '.') return true

  /** if the importee is not a svelte file, do nothing */
  if (!isSvelteFile(importeePath)) return false

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
          // istanbul ignore else
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
      // istanbul ignore next
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
  ].reduce((acc, diagnostic) => {
    if (isValidSvelteImportDiagnostic(filename, diagnostic)) {
      return acc
    }

    acc.push(diagnostic)

    return acc
  }, [])

  return { code, map, diagnostics }
}

module.exports = ({ content, filename, options }) => {
  const fileDirectory = options.tsconfigDirectory || dirname(filename)
  const tsconfigFile =
    options.tsconfigFile || ts.findConfigFile(fileDirectory, ts.sys.fileExists)
  const basePath = tsconfigFile ? dirname(tsconfigFile) : process.cwd()

  let compilerOptionsJSON = Object.assign(
    // default options
    {
      moduleResolution: 'node',
      sourceMap: true,
      strict: true,
    },
    options.compilerOptions,
  )

  if (tsconfigFile) {
    const { error, config } = ts.readConfigFile(tsconfigFile, ts.sys.readFile)
    if (error) {
      throw new Error(formatDiagnostics(error, basePath))
    }

    compilerOptionsJSON = Object.assign(
      {},
      compilerOptionsJSON,
      config.compilerOptions,
    )
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

  let code, map, diagnostics
  if (options.transpileOnly || compilerOptions.transpileOnly) {
    ;({
      outputText: code,
      sourceMapText: map,
      diagnostics,
    } = ts.transpileModule(content, {
      fileName: filename,
      compilerOptions: compilerOptions,
      reportDiagnostics: options.reportDiagnostics !== false,
    }))
  } else {
    ;({ code, map, diagnostics } = compileFileFromMemory(compilerOptions, {
      filename,
      content,
    }))
  }

  if (diagnostics.length > 0) {
    // could this be handled elsewhere?
    const formattedDiagnostics = formatDiagnostics(diagnostics, basePath)
    console.log(formattedDiagnostics)
  }

  return {
    code,
    map,
    diagnostics,
  }
}
