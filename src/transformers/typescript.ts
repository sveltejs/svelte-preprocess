import { existsSync } from 'fs';
import { dirname, basename, resolve } from 'path';

import ts from 'typescript';

import { Transformer, Options } from '../types';
import { throwTypescriptError } from '../modules/errors';

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

const TS_TRANSFORMERS = {
  before: [importTransformer],
};

const TS2552_REGEX = /Cannot find name '\$([a-zA-Z0-9_]+)'. Did you mean '([a-zA-Z0-9_]+)'\?/i;

function isValidSvelteReactiveValueDiagnostic(
  filename: string,
  diagnostic: any,
): boolean {
  if (diagnostic.code !== 2552) return true;

  /** if the importee is not a svelte file, do nothing */
  if (!isSvelteFile(filename)) return true;

  /** if error message doesn't contain a reactive value, do nothing */
  if (!diagnostic.messageText.includes('$')) return true;

  const [, usedVar, proposedVar] =
    diagnostic.messageText.match(TS2552_REGEX) || [];

  return !(usedVar && proposedVar && usedVar === proposedVar);
}

function createImportTransformerFromProgram(program: ts.Program) {
  const checker = program.getTypeChecker();

  const importedTypeRemoverTransformer: ts.TransformerFactory<ts.SourceFile> = (
    context,
  ) => {
    const visit: ts.Visitor = (node) => {
      if (!ts.isImportDeclaration(node)) {
        return ts.visitEachChild(node, (child) => visit(child), context);
      }

      let newImportClause: ts.ImportClause = node.importClause;

      if (node.importClause) {
        // import type {...} from './blah'
        if (node.importClause?.isTypeOnly) {
          return ts.createEmptyStatement();
        }

        // import Blah, { blah } from './blah'
        newImportClause = ts.getMutableClone(node.importClause);

        // types can't be default exports, so we just worry about { blah } and { blah as name } exports
        if (
          newImportClause.namedBindings &&
          ts.isNamedImports(newImportClause.namedBindings)
        ) {
          const newBindings = ts.getMutableClone(newImportClause.namedBindings);
          const newElements = [];

          newImportClause.namedBindings = undefined;

          for (const spec of newBindings.elements) {
            const ident = spec.name;

            const symbol = checker.getSymbolAtLocation(ident);
            const aliased = checker.getAliasedSymbol(symbol);

            if (aliased) {
              if (
                (aliased.flags &
                  (ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface)) >
                0
              ) {
                // We found an imported type, don't add to our new import clause
                continue;
              }
            }

            newElements.push(spec);
          }

          if (newElements.length > 0) {
            newBindings.elements = ts.createNodeArray(
              newElements,
              newBindings.elements.hasTrailingComma,
            );
            newImportClause.namedBindings = newBindings;
          }
        }

        // we ended up removing all named bindings and we didn't have a name? nothing left to import.
        if (
          newImportClause.namedBindings == null &&
          newImportClause.name == null
        ) {
          return ts.createEmptyStatement();
        }
      }

      return ts.createImportDeclaration(
        node.decorators,
        node.modifiers,
        newImportClause,
        node.moduleSpecifier,
      );
    };

    return (node) => ts.visitNode(node, visit);
  };

  return importedTypeRemoverTransformer;
}

export function compileFileFromMemory(
  compilerOptions: CompilerOptions,
  { filename, content }: { filename: string; content: string },
) {
  let code = content;
  let map;

  const realHost = ts.createCompilerHost(compilerOptions, true);
  const dummyFileName = ts.sys.resolvePath(filename);

  const isDummyFile = (fileName: string) =>
    ts.sys.resolvePath(fileName) === dummyFileName;

  const host: ts.CompilerHost = {
    fileExists: (fileName) =>
      isDummyFile(fileName) || realHost.fileExists(fileName),
    getCanonicalFileName: (fileName) =>
      isDummyFile(fileName)
        ? ts.sys.useCaseSensitiveFileNames
          ? fileName
          : fileName.toLowerCase()
        : realHost.getCanonicalFileName(fileName),
    getSourceFile: (
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile,
      // eslint-disable-next-line max-params
    ) =>
      isDummyFile(fileName)
        ? ts.createSourceFile(dummyFileName, code, languageVersion)
        : realHost.getSourceFile(
            fileName,
            languageVersion,
            onError,
            shouldCreateNewSourceFile,
          ),
    readFile: (fileName) =>
      isDummyFile(fileName) ? content : realHost.readFile(fileName),
    writeFile: (fileName, data) => {
      if (fileName.endsWith('.map')) {
        map = data;
      } else {
        code = data;
      }
    },
    directoryExists:
      realHost.directoryExists && realHost.directoryExists.bind(realHost),
    getCurrentDirectory: realHost.getCurrentDirectory.bind(realHost),
    getDirectories: realHost.getDirectories.bind(realHost),
    getNewLine: realHost.getNewLine.bind(realHost),
    getDefaultLibFileName: realHost.getDefaultLibFileName.bind(realHost),
    resolveModuleNames:
      realHost.resolveModuleNames && realHost.resolveModuleNames.bind(realHost),
    useCaseSensitiveFileNames: realHost.useCaseSensitiveFileNames.bind(
      realHost,
    ),
  };

  const program = ts.createProgram([dummyFileName], compilerOptions, host);

  const transformers = {
    before: [createImportTransformerFromProgram(program)],
  };

  const emitResult = program.emit(
    program.getSourceFile(dummyFileName),
    undefined,
    undefined,
    undefined,
    transformers,
  );

  // collect diagnostics without svelte import errors
  const diagnostics = [
    ...emitResult.diagnostics,
    ...ts.getPreEmitDiagnostics(program),
  ].filter(
    (diagnostic) =>
      isValidSvelteImportDiagnostic(filename, diagnostic) &&
      isValidSvelteReactiveValueDiagnostic(filename, diagnostic),
  );

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

  let code;
  let map;
  let diagnostics: ts.Diagnostic[];

  if (options.transpileOnly || compilerOptions.transpileOnly) {
    ({ outputText: code, sourceMapText: map, diagnostics } = ts.transpileModule(
      content,
      {
        fileName: filename,
        compilerOptions,
        reportDiagnostics: options.reportDiagnostics !== false,
        transformers: TS_TRANSFORMERS,
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
    dependencies: [] as string[],
  };
};

export default transformer;
