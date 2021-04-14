import { dirname, isAbsolute, join } from 'path';

import ts from 'typescript';
import { compile } from 'svelte/compiler';

import { throwTypescriptError } from '../modules/errors';
import { createTagRegex, parseAttributes, stripTags } from '../modules/markup';
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

function getComponentScriptContent(markup: string): string {
  const regex = createTagRegex('script', 'gi');
  let match: RegExpMatchArray;

  while ((match = regex.exec(markup)) !== null) {
    const { context } = parseAttributes(match[1]);

    if (context !== 'module') {
      return match[2];
    }
  }

  return '';
}

function injectVarsToCode({
  content,
  markup,
  filename,
  attributes,
}: {
  content: string;
  markup?: string;
  filename?: string;
  attributes?: Record<string, any>;
}): string {
  if (!markup) return content;

  const { vars } = compile(stripTags(markup), {
    generate: false,
    varsReport: 'full',
    errorMode: 'warn',
    filename,
  });

  const sep = '\nconst $$$$$$$$ = null;\n';
  const varsValues = vars.map((v) => v.name).join(',');
  const injectedVars = `const $$vars$$ = [${varsValues}];`;

  if (attributes?.context === 'module') {
    const componentScript = getComponentScriptContent(markup);

    return `${content}${sep}${componentScript}\n${injectedVars}`;
  }

  return `${content}${sep}${injectedVars}`;
}

function stripInjectedCode({
  compiledCode,
  markup,
}: {
  compiledCode: string;
  markup?: string;
}): string {
  return markup
    ? compiledCode.slice(0, compiledCode.indexOf('const $$$$$$$$ = null;'))
    : compiledCode;
}

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
  markup,
  options = {},
  attributes,
}) => {
  // default options
  const compilerOptionsJSON = {
    moduleResolution: 'node',
    target: 'es6',
  };

  const basePath = process.cwd();

  Object.assign(compilerOptionsJSON, options.compilerOptions);

  const { errors, options: convertedCompilerOptions } =
    options.tsconfigFile !== false || options.tsconfigDirectory
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

  const {
    outputText: compiledCode,
    sourceMapText: map,
    diagnostics,
  } = ts.transpileModule(
    injectVarsToCode({ content, markup, filename, attributes }),
    {
      fileName: filename,
      compilerOptions,
      reportDiagnostics: options.reportDiagnostics !== false,
      transformers: markup ? {} : { before: [importTransformer] },
    },
  );

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

  const code = stripInjectedCode({ compiledCode, markup });

  return {
    code,
    map,
    diagnostics,
  };
};

export { transformer };
