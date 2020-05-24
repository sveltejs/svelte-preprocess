import { existsSync } from 'fs';
import { dirname, basename, resolve } from 'path';

import ts from 'typescript';

import { Transformer, Options } from '../types';

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

const importTransformer: ts.TransformerFactory<ts.SourceFile> = context => {
  const visit: ts.Visitor = node => {
    if (ts.isImportDeclaration(node)) {
      return ts.createImportDeclaration(
        node.decorators,
        node.modifiers,
        node.importClause,
        node.moduleSpecifier,
      );
    }
    return ts.visitEachChild(node, child => visit(child), context);
  };

  return node => ts.visitNode(node, visit);
};

function findImportUsages(
  node: ts.Node,
  context: ts.TransformationContext,
): { [name: string]: number } {
  const usages: { [name: string]: number } = {};

  let locals = new Set<string>();

  const enterScope = <T>(action: () => T) => {
    const oldLocals = locals;
    locals = new Set([...locals]);
    const result = action();
    locals = oldLocals;
    return result;
  };

  const findUsages: ts.Visitor = node => {
    if (ts.isImportClause(node)) {
      const bindings = node.namedBindings;
      if (bindings && 'elements' in bindings) {
        bindings.elements.forEach(
          binding => (usages[binding.name.escapedText as string] = 0),
        );
      }
      return node;
    }

    if (ts.isFunctionDeclaration(node)) {
      return enterScope(() => {
        node.parameters
          .map(p => p.name)
          .filter(ts.isIdentifier)
          .forEach(p => locals.add(p.escapedText as string));
        return ts.visitEachChild(node, child => findUsages(child), context);
      });
    }

    if (ts.isBlock(node)) {
      return enterScope(() =>
        ts.visitEachChild(node, child => findUsages(child), context),
      );
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      locals.add(node.name.escapedText as string);
    } else if (ts.isIdentifier(node)) {
      const identifier = node.escapedText as string;
      if (!locals.has(identifier) && usages[identifier] != undefined) {
        usages[identifier]++;
      }
    }

    return ts.visitEachChild(node, child => findUsages(child), context);
  };

  ts.visitNode(node, findUsages);

  return usages;
}

const removeNonEmittingImports: (
  mainFile?: string,
) => ts.TransformerFactory<ts.SourceFile> = mainFile => context => {
  function createVisitor(usages: { [name: string]: number }) {
    const visit: ts.Visitor = node => {
      if (ts.isImportDeclaration(node)) {
        let importClause = node.importClause;
        const bindings = importClause.namedBindings;

        if (bindings && ts.isNamedImports(bindings)) {
          const namedImports = bindings.elements.filter(
            element => usages[element.name.getText()] > 0,
          );

          if (namedImports.length !== bindings.elements.length) {
            return ts.createImportDeclaration(
              node.decorators,
              node.modifiers,
              namedImports.length == 0
                ? undefined
                : ts.createImportClause(
                    importClause.name,
                    ts.createNamedImports(namedImports),
                  ),
              node.moduleSpecifier,
            );
          }
        }

        return node;
      }

      if (
        ts.isVariableStatement(node) &&
        node.modifiers &&
        node.modifiers[0] &&
        node.modifiers[0].kind == ts.SyntaxKind.ExportKeyword
      ) {
        const name = node.declarationList.declarations[0].name;

        if (ts.isIdentifier(name) && name.escapedText == '___used_tags__') {
          return undefined;
        }
      }

      return ts.visitEachChild(node, child => visit(child), context);
    };

    return visit;
  }

  return node =>
    !mainFile || ts.sys.resolvePath(node.fileName) === mainFile
      ? ts.visitNode(node, createVisitor(findImportUsages(node, context)))
      : node;
};

function createTransforms(mainFile?: string) {
  return {
    before: [importTransformer],
    after: [removeNonEmittingImports(mainFile)],
  };
}

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

function findTagsInMarkup(markup: string) {
  if (!markup) {
    return [];
  }

  let match: RegExpExecArray;
  const result: string[] = [];
  const findTag = /<([A-Z][^\s\/>]*)([\s\S]*?)>/g;
  const template = markup
    .replace(/<script([\s\S]*?)(?:>([\s\S]*)<\/script>|\/>)/g, '')
    .replace(/<style([\s\S]*?)(?:>([\s\S]*)<\/style>|\/>)/g, '');

  while ((match = findTag.exec(template)) !== null) {
    result.push(match[1]);
  }

  return result;
}

function compileFileFromMemory(
  compilerOptions: CompilerOptions,
  { filename, content }: { filename: string; content: string },
) {
  let code = content;
  let map;

  const realHost = ts.createCompilerHost(compilerOptions, true);
  const dummyFileName = ts.sys.resolvePath(filename);
  const dummyBaseName = basename(dummyFileName);
  const isDummyFile = (fileName: string) =>
    ts.sys.resolvePath(fileName) === dummyFileName;

  const host: ts.CompilerHost = {
    fileExists: fileName =>
      isDummyFile(fileName) || realHost.fileExists(fileName),
    getCanonicalFileName: fileName =>
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
    ) =>
      isDummyFile(fileName)
        ? ts.createSourceFile(dummyFileName, code, languageVersion)
        : realHost.getSourceFile(
            fileName,
            languageVersion,
            onError,
            shouldCreateNewSourceFile,
          ),
    readFile: fileName =>
      isDummyFile(fileName) ? content : realHost.readFile(fileName),
    writeFile: (fileName, data) => {
      switch (basename(fileName)) {
        case dummyBaseName + '.js.map':
          map = data;
          break;
        case dummyBaseName + '.js':
          code = data;
          break;
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

  const emitResult = program.emit(
    undefined,
    undefined,
    undefined,
    undefined,
    createTransforms(dummyFileName),
  );

  // collect diagnostics without svelte import errors
  const diagnostics = [
    ...emitResult.diagnostics,
    ...ts.getPreEmitDiagnostics(program),
  ].filter(
    diagnostic =>
      isValidSvelteImportDiagnostic(filename, diagnostic) &&
      isValidSvelteReactiveValueDiagnostic(filename, diagnostic),
  );

  return { code, map, diagnostics };
}

const transformer: Transformer<Options.Typescript> = ({
  content,
  filename,
  options,
  markup,
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

  // Force module kind to es2015, so we keep the correct names.
  compilerOptions.module = ts.ModuleKind.ES2015;

  // Generate separate source maps.
  compilerOptions.sourceMap = true;
  compilerOptions.inlineSourceMap = false;

  const tagsInMarkup = findTagsInMarkup(markup);

  let code, map, diagnostics;

  // Append all used tags
  content += '\nexport const __used_tags__=[' + tagsInMarkup.join(',') + '];';

  if (options.transpileOnly || compilerOptions.transpileOnly) {
    ({ outputText: code, sourceMapText: map, diagnostics } = ts.transpileModule(
      content,
      {
        fileName: filename,
        compilerOptions: compilerOptions,
        reportDiagnostics: options.reportDiagnostics !== false,
        transformers: createTransforms(),
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
