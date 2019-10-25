import { existsSync } from 'fs';
import { dirname, basename, resolve } from 'path';
import ts from 'typescript';

import { Transformer, Options } from '../typings';

type CompilerOptions = Options.Typescript['compilerOptions'];

function createFormatDiagnosticsHost(cwd: string) {
  return {
    getCanonicalFileName: (fileName: string) => fileName,
    getCurrentDirectory: () => cwd,
    getNewLine: () => ts.sys.newLine,
  };
}

function formatDiagnostics(
  diagnostics: ts.Diagnostic | ts.Diagnostic[],
  basePath: string,
) {
  if (Array.isArray(diagnostics)) {
    return ts.formatDiagnosticsWithColorAndContext(
      diagnostics,
      createFormatDiagnosticsHost(basePath),
    );
  }
  return ts.formatDiagnostic(
    diagnostics,
    createFormatDiagnosticsHost(basePath),
  );
}

function getFilenameExtension(filename: string) {
  filename = basename(filename);
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex <= 0) return '';
  return filename.substr(lastDotIndex + 1);
}

function isSvelteFile(filename: string) {
  const importExtension = getFilenameExtension(filename);
  return importExtension === 'svelte' || importExtension === 'html';
}

const IMPORTEE_PATTERN = /['"](.*?)['"]/;
function isValidSvelteImportDiagnostic(filename: string, diagnostic: any) {
  // TS2307: 'cannot find module'
  if (diagnostic.code !== 2307) return true;

  const importeeMatch = diagnostic.messageText.match(IMPORTEE_PATTERN);
  // istanbul ignore if
  if (!importeeMatch) return true;

  let [, importeePath] = importeeMatch;
  /** if we're not dealing with a relative path, assume the file exists */
  if (importeePath[0] !== '.') return false;

  /** if the importee is not a svelte file, do nothing */
  if (!isSvelteFile(importeePath)) return true;

  importeePath = resolve(dirname(filename), importeePath);

  return existsSync(importeePath) === false;
}

const TS_TRANSFORMERS = {
  before: [
    (context: any) => {
      const visit = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (ts.isImportDeclaration(node)) {
          const importedFilename = node.moduleSpecifier.getText().slice(1, -1);
          // istanbul ignore else
          if (isSvelteFile(importedFilename)) {
            return ts.createImportDeclaration(
              node.decorators,
              node.modifiers,
              node.importClause,
              node.moduleSpecifier,
            );
          }
        }
        return ts.visitEachChild(node, child => visit(child), context);
      };

      return (node: any) => ts.visitNode(node, visit);
    },
  ],
};

function compileFileFromMemory(
  compilerOptions: CompilerOptions,
  { filename, content }: { filename: string; content: string },
) {
  let code = content;
  let map;

  const realHost = ts.createCompilerHost(compilerOptions, true);
  const dummyFilePath = filename;
  const dummySourceFile = ts.createSourceFile(
    dummyFilePath,
    code,
    ts.ScriptTarget.Latest,
  );

  const host = {
    fileExists: (filePath: string) =>
      filePath === dummyFilePath || realHost.fileExists(filePath),
    directoryExists:
      realHost.directoryExists && realHost.directoryExists.bind(realHost),
    getCurrentDirectory: realHost.getCurrentDirectory.bind(realHost),
    getDirectories: realHost.getDirectories.bind(realHost),
    getCanonicalFileName: (fileName: string) =>
      realHost.getCanonicalFileName(fileName),
    getNewLine: realHost.getNewLine.bind(realHost),
    getDefaultLibFileName: realHost.getDefaultLibFileName.bind(realHost),
    getSourceFile: (
      fileName: string,
      languageVersion: ts.ScriptTarget,
      onError: () => any,
      shouldCreateNewSourceFile: boolean,
    ) =>
      fileName === dummyFilePath
        ? dummySourceFile
        : realHost.getSourceFile(
            fileName,
            languageVersion,
            onError,
            shouldCreateNewSourceFile,
          ),
    readFile: (filePath: string) =>
      // istanbul ignore next
      filePath === dummyFilePath ? content : realHost.readFile(filePath),
    useCaseSensitiveFileNames: () => realHost.useCaseSensitiveFileNames(),
    writeFile: (fileName: string, data: string) => {
      if (fileName.endsWith('.map')) {
        map = data;
      } else {
        code = data;
      }
    },
  };

  const program = ts.createProgram(
    [dummyFilePath],
    compilerOptions,
    (host as any) as ts.CompilerHost,
  );
  const emitResult = program.emit(
    undefined,
    undefined,
    undefined,
    undefined,
    TS_TRANSFORMERS,
  );

  // collect diagnostics without svelte import errors
  const diagnostics = [
    ...emitResult.diagnostics,
    ...ts.getPreEmitDiagnostics(program),
  ].filter(diagnostic => isValidSvelteImportDiagnostic(filename, diagnostic));

  return { code, map, diagnostics };
}

const transformer: Transformer<Options.Typescript> = ({
  content,
  filename,
  options,
}) => {
  // default options
  const compilerOptionsJSON = {
    moduleResolution: 'node',
    sourceMap: true,
    strict: true,
    target: 'es6',
  };
  let basePath = process.cwd();

  if (options.tsconfigFile !== false || options.tsconfigDirectory) {
    const fileDirectory = (options.tsconfigDirectory ||
      dirname(filename)) as string;
    const tsconfigFile = (options.tsconfigFile ||
      ts.findConfigFile(fileDirectory, ts.sys.fileExists)) as string;
    basePath = dirname(tsconfigFile);

    const { error, config } = ts.readConfigFile(tsconfigFile, ts.sys.readFile);
    if (error) {
      throw new Error(formatDiagnostics(error, basePath));
    }

    Object.assign(compilerOptionsJSON, config.compilerOptions);
  }

  Object.assign(compilerOptionsJSON, options.compilerOptions);

  const {
    errors,
    options: convertedCompilerOptions,
  } = ts.convertCompilerOptionsFromJson(compilerOptionsJSON, basePath);
  if (errors.length) {
    throw new Error(formatDiagnostics(errors, basePath));
  }

  const compilerOptions = {
    ...(convertedCompilerOptions as CompilerOptions),
    allowNonTsExtensions: true,
  };

  if (
    compilerOptions.target === ts.ScriptTarget.ES3 ||
    compilerOptions.target === ts.ScriptTarget.ES5
  ) {
    throw new Error(
      `Svelte only supports es6+ syntax. Set your 'compilerOptions.target' to 'es6' or higher.`,
    );
  }

  let code, map, diagnostics;
  if (options.transpileOnly || compilerOptions.transpileOnly) {
    ({ outputText: code, sourceMapText: map, diagnostics } = ts.transpileModule(
      content,
      {
        fileName: filename,
        compilerOptions: compilerOptions,
        reportDiagnostics: options.reportDiagnostics !== false,
      },
    ));
  } else {
    ({ code, map, diagnostics } = compileFileFromMemory(compilerOptions, {
      filename,
      content,
    }));
  }

  if (diagnostics.length > 0) {
    // could this be handled elsewhere?
    const formattedDiagnostics = formatDiagnostics(diagnostics, basePath);
    console.log(formattedDiagnostics);
  }

  return {
    code,
    map,
    diagnostics,
    dependencies: [] as string[],
  };
};

export default transformer;
