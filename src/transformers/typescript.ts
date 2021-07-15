import { dirname, isAbsolute, join, resolve } from 'path';

import ts from 'typescript';

import { throwTypescriptError } from '../modules/errors';
import type { Transformer, Options } from '../types';

type CompilerOptions = Options.Typescript['compilerOptions'];

function createFormatDiagnosticsHost(cwd: string): ts.FormatDiagnosticsHost {
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

const importTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  const visit: ts.Visitor = (node) => {
    if (ts.isImportDeclaration(node)) {
      if (node.importClause?.isTypeOnly) {
        return ts.createEmptyStatement();
      }

      return ts.createImportDeclaration(
        node.decorators,
        node.modifiers,
        node.importClause,
        node.moduleSpecifier,
      );
    }

    return ts.visitEachChild(node, (child) => visit(child), context);
  };

  return (node) => ts.visitNode(node, visit);
};

export function loadTsconfig(
  compilerOptionsJSON: any,
  filename: string,
  tsOptions: Options.Typescript,
) {
  if (typeof tsOptions.tsconfigFile === 'boolean') {
    return { errors: [], options: compilerOptionsJSON };
  }

  let basePath = process.cwd();

  const fileDirectory = (tsOptions.tsconfigDirectory ||
    dirname(filename)) as string;

  let tsconfigFile =
    tsOptions.tsconfigFile ||
    ts.findConfigFile(fileDirectory, ts.sys.fileExists);

  if (!tsconfigFile) {
    return { errors: [], options: {} };
  }

  tsconfigFile = isAbsolute(tsconfigFile)
    ? tsconfigFile
    : join(basePath, tsconfigFile);

  basePath = dirname(tsconfigFile);

  const { error, config } = ts.readConfigFile(tsconfigFile, ts.sys.readFile);

  if (error) {
    throw new Error(formatDiagnostics(error, basePath));
  }

  // Do this so TS will not search for initial files which might take a while
  config.include = [];

  let { errors, options } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    basePath,
    compilerOptionsJSON,
    tsconfigFile,
  );

  // Filter out "no files found error"
  errors = errors.filter((d) => d.code !== 18003);

  return { errors, options };
}

const transformer: Transformer<Options.Typescript> = ({
  content,
  filename,
  options = {},
}) => {
  // default options
  const compilerOptionsJSON = {
    moduleResolution: 'node',
    target: 'es6',
  };

  const basePath = process.cwd();

  Object.assign(compilerOptionsJSON, options.compilerOptions);

  const { errors, options: convertedCompilerOptions } =
    options.tsconfigFile || options.tsconfigDirectory
      ? loadTsconfig(compilerOptionsJSON, filename, options)
      : ts.convertCompilerOptionsFromJson(compilerOptionsJSON, basePath);

  if (errors.length) {
    throw new Error(formatDiagnostics(errors, basePath));
  }

  const compilerOptions: CompilerOptions = {
    ...(convertedCompilerOptions as CompilerOptions),
    importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Error,
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

  const absoluteFilename = isAbsolute(filename)
    ? filename
    : resolve(basePath, filename);

  const {
    outputText: code,
    sourceMapText: map,
    diagnostics,
  } = ts.transpileModule(content, {
    fileName: absoluteFilename,
    compilerOptions,
    reportDiagnostics: options.reportDiagnostics !== false,
    transformers: {
      before: [importTransformer],
    },
  });

  if (diagnostics.length > 0) {
    // could this be handled elsewhere?
    const hasError = diagnostics.some(
      (d) => d.category === ts.DiagnosticCategory.Error,
    );

    const formattedDiagnostics = formatDiagnostics(diagnostics, basePath);

    console.log(formattedDiagnostics);

    if (hasError) {
      throwTypescriptError();
    }
  }

  return {
    code,
    map,
    diagnostics,
  };
};

export { transformer };
