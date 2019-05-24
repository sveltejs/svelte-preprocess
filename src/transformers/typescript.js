const ts = require('typescript')
const { dirname } = require('path')

function createFormatDiagnosticsHost(cwd) {
  return {
    getCanonicalFileName: fileName => fileName,
    getCurrentDirectory: () => cwd,
    getNewLine: () => ts.sys.newLine,
  }
}

function formatDiagnostic(error, basePath) {
  return ts.formatDiagnostic(error, createFormatDiagnosticsHost(basePath))
}

function formatDiagnostics(diagnostics, basePath) {
  return ts.formatDiagnosticsWithColorAndContext(
    diagnostics,
    createFormatDiagnosticsHost(basePath),
  )
}

function compileFileFromMemory(compilerOptions, { filename, content }) {
  let code = content
  let map

  const realHost = ts.createCompilerHost(compilerOptions, true)
  const dummyFilePath = filename.replace(/\..*$/, '.ts')
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
  const emitResult = program.emit()

  const diagnostics = [
    ...emitResult.diagnostics,
    ...ts.getPreEmitDiagnostics(program),
  ].map(({ file, ...diagnostic }) => {
    return {
      file: {
        fileName: filename,
        text: content,
      },
      ...diagnostic,
    }
  })

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
      throw new Error(formatDiagnostic(error, basePath))
    }

    compilerOptionsJSON = {
      target: 'es5',
      strict: true,
      module: 'es2015',
      moduleResolution: 'node',
      sourceMap: true,
      ...(config.compilerOptions || {}),
      ...compilerOptionsJSON,
    }
  }

  const {
    errors,
    options: compilerOptions,
  } = ts.convertCompilerOptionsFromJson(compilerOptionsJSON, basePath)
  if (errors.length) {
    throw new Error(formatDiagnostics(errors, basePath))
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
