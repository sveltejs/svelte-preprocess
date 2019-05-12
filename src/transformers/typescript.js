const ts = require('typescript')
const path = require('path')

module.exports = ({ content, filename, options }) => {
  const fileDirectory = options.tsconfigDirectory || path.dirname(filename)
  const tsconfigPath =
    options.tsconfigPath || ts.findConfigFile(fileDirectory, ts.sys.fileExists)
  const basePath = tsconfigPath ? path.dirname(tsconfigPath) : process.cwd()

  let compilerOptionsJSON = options.compilerOptions || {}
  if (tsconfigPath) {
    const { error, config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
    if (error) {
      const err = ts.formatDiagnostic(
        error,
        createFormatDiagnosticsHost(basePath),
      )
      throw new Error(err)
    }
    compilerOptionsJSON = {
      ...(config.compilerOptions || {}),
      ...compilerOptionsJSON,
    }
  }

  const {
    errors,
    options: compilerOptions,
  } = ts.convertCompilerOptionsFromJson(compilerOptionsJSON, basePath)
  if (errors.length) {
    const err = ts.formatDiagnostics(
      errors,
      createFormatDiagnosticsHost(basePath),
    )
    throw new Error(err)
  }

  const {
    outputText: code,
    sourceMapText: map,
    diagnostics,
  } = ts.transpileModule(content, {
    fileName: filename,
    compilerOptions: compilerOptions,
    reportDiagnostics: options.reportDiagnostics !== false,
  })

  if (diagnostics.length) {
    const diagnosticMessage = ts.formatDiagnostics(
      diagnostics,
      createFormatDiagnosticsHost(basePath),
    )
    console.log(diagnosticMessage)
  }

  return { code, map }
}

function createFormatDiagnosticsHost(cwd) {
  return {
    getCanonicalFileName: fileName => fileName,
    getCurrentDirectory: () => cwd,
    getNewLine: () => ts.sys.newLine,
  }
}
