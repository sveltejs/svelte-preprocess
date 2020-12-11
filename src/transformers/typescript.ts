/* eslint-disable @typescript-eslint/naming-convention */
import { dirname } from 'path';

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

  let basePath = process.cwd();

  if (options.tsconfigFile !== false || options.tsconfigDirectory) {
    const fileDirectory = (options.tsconfigDirectory ||
      dirname(filename)) as string;

    const tsconfigFile =
      options.tsconfigFile ||
      ts.findConfigFile(fileDirectory, ts.sys.fileExists);

    if (typeof tsconfigFile === 'string') {
      basePath = dirname(tsconfigFile);

      const { error, config } = ts.readConfigFile(
        tsconfigFile,
        ts.sys.readFile,
      );

      if (error) {
        throw new Error(formatDiagnostics(error, basePath));
      }

      Object.assign(compilerOptionsJSON, config.compilerOptions);
    }
  }

  Object.assign(compilerOptionsJSON, options.compilerOptions);

  const {
    errors,
    options: convertedCompilerOptions,
  } = ts.convertCompilerOptionsFromJson(compilerOptionsJSON, basePath);

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

  const {
    outputText: code,
    sourceMapText: map,
    diagnostics,
  } = ts.transpileModule(content, {
    fileName: filename,
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

const is_sync = true;

export { transformer, is_sync };
