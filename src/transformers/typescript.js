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
      target: 'es5',
      strict: true,
      module: 'es2015',
      moduleResolution: 'node',
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

  function compileTypeScriptCode(code, realFilename) {
    const realHost = ts.createCompilerHost(compilerOptions, true)

    const dummyFilePath = realFilename.replace(/\..*$/, '.ts')

    const dummySourceFile = ts.createSourceFile(
      dummyFilePath,
      code,
      ts.ScriptTarget.Latest,
    )
    let outputCode

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
        filePath === dummyFilePath ? code : realHost.readFile(filePath),
      useCaseSensitiveFileNames: () => realHost.useCaseSensitiveFileNames(),
      writeFile: (fileName, data) => (outputCode = data),
    }

    const program = ts.createProgram([dummyFilePath], compilerOptions, host)
    const emitResult = program.emit()
    const diagnostics = [
      ...emitResult.diagnostics,
      ...ts.getPreEmitDiagnostics(program),
    ].map(diagnostic => {
      console.log(diagnostic)
      diagnostic.filename = diagnostic.filename.replace('.ts', '.svelte')
    })

    if (diagnostics.length > 0) {
      const formattedDiagnostics = ts.formatDiagnosticsWithColorAndContext(
        diagnostics,
        host,
      )
      console.log(formattedDiagnostics)
    }

    return {
      code: outputCode,
      diagnostics,
    }
  }

  console.log('==== Evaluating code ====')
  console.log(content)
  console.log()

  const result = compileTypeScriptCode(content, filename)

  console.log('==== Output code ====')
  console.log(result.code)
  console.log()

  // compile([filename], {
  //   ...compilerOptions,
  //   noEmitOnError: true,
  //   noImplicitAny: true,
  //   target: ts.ScriptTarget.ES5,
  // })

  // if (diagnostics.length) {
  //   const diagnosticMessage = ts.formatDiagnostics(
  //     diagnostics,
  //     createFormatDiagnosticsHost(basePath),
  //   )
  //   console.log(diagnosticMessage)
  // }

  return { code, map }
}

function createFormatDiagnosticsHost(cwd) {
  return {
    getCanonicalFileName: fileName => fileName,
    getCurrentDirectory: () => cwd,
    getNewLine: () => ts.sys.newLine,
  }
}
