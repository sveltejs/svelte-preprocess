import { dirname, isAbsolute, join } from 'path';

import ts from 'typescript';
import { compile } from 'svelte/compiler';
import MagicString from 'magic-string';
import sorcery from 'sorcery';

import { throwTypescriptError } from '../modules/errors';
import { createTagRegex, parseAttributes, stripTags } from '../modules/markup';
import type { Transformer, Options } from '../types';

type CompilerOptions = ts.CompilerOptions;

type SourceMapChain = {
  content: Record<string, string>;
  sourcemaps: Record<string, object>;
};

function createFormatDiagnosticsHost(cwd: string): ts.FormatDiagnosticsHost {
  return {
    getCanonicalFileName: (fileName: string) =>
      fileName.replace('.injected.ts', ''),
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

function createSourceMapChain({
  filename,
  content,
  compilerOptions,
}: {
  filename: string;
  content: string;
  compilerOptions: CompilerOptions;
}): SourceMapChain | undefined {
  if (compilerOptions.sourceMap) {
    return {
      content: {
        [filename]: content,
      },
      sourcemaps: {},
    };
  }
}

function injectVarsToCode({
  content,
  markup,
  filename,
  attributes,
  sourceMapChain,
}: {
  content: string;
  markup?: string;
  filename: string;
  attributes?: Record<string, any>;
  sourceMapChain?: SourceMapChain;
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
  const injectedCode =
    attributes?.context === 'module'
      ? `${sep}${getComponentScriptContent(markup)}\n${injectedVars}`
      : `${sep}${injectedVars}`;

  if (sourceMapChain) {
    const s = new MagicString(content);

    s.append(injectedCode);

    const fname = `${filename}.injected.ts`;
    const code = s.toString();
    const map = s.generateMap({
      source: filename,
      file: fname,
    });

    sourceMapChain.content[fname] = code;
    sourceMapChain.sourcemaps[fname] = map;

    return code;
  }

  return `${content}${injectedCode}`;
}

function stripInjectedCode({
  transpiledCode,
  markup,
  filename,
  sourceMapChain,
}: {
  transpiledCode: string;
  markup?: string;
  filename: string;
  sourceMapChain?: SourceMapChain;
}): string {
  if (!markup) return transpiledCode;

  const injectedCodeStart = transpiledCode.indexOf('const $$$$$$$$ = null;');

  if (sourceMapChain) {
    const s = new MagicString(transpiledCode);
    const st = s.snip(0, injectedCodeStart);

    const source = `${filename}.transpiled.js`;
    const file = `${filename}.js`;
    const code = st.toString();
    const map = st.generateMap({
      source,
      file,
    });

    sourceMapChain.content[file] = code;
    sourceMapChain.sourcemaps[file] = map;

    return code;
  }

  return transpiledCode.slice(0, injectedCodeStart);
}

async function concatSourceMaps({
  filename,
  markup,
  sourceMapChain,
}: {
  filename: string;
  markup?: string;
  sourceMapChain?: SourceMapChain;
}): Promise<string | object | undefined> {
  if (!sourceMapChain) return;

  if (!markup) {
    return sourceMapChain.sourcemaps[`${filename}.js`];
  }

  const chain = await sorcery.load(`${filename}.js`, sourceMapChain);

  return chain.apply();
}

function getCompilerOptions({
  filename,
  options,
  basePath,
}: {
  filename: string;
  options: Options.Typescript;
  basePath: string;
}): CompilerOptions {
  // default options
  const compilerOptionsJSON = {
    moduleResolution: 'node',
    target: 'es6',
  };

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

  return compilerOptions;
}

function transpileTs({
  code,
  markup,
  filename,
  basePath,
  options,
  compilerOptions,
  sourceMapChain,
}: {
  code: string;
  markup: string;
  filename: string;
  basePath: string;
  options: Options.Typescript;
  compilerOptions: CompilerOptions;
  sourceMapChain: SourceMapChain;
}): { transpiledCode: string; diagnostics: ts.Diagnostic[] } {
  const fileName = markup ? `${filename}.injected.ts` : filename;

  const {
    outputText: transpiledCode,
    sourceMapText,
    diagnostics,
  } = ts.transpileModule(code, {
    fileName,
    compilerOptions,
    reportDiagnostics: options.reportDiagnostics !== false,
    transformers: markup ? {} : { before: [importTransformer] },
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

  if (sourceMapChain) {
    const fname = markup ? `${filename}.transpiled.js` : `${filename}.js`;

    sourceMapChain.content[fname] = transpiledCode;
    sourceMapChain.sourcemaps[fname] = JSON.parse(sourceMapText);
  }

  return { transpiledCode, diagnostics };
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

const transformer: Transformer<Options.Typescript> = async ({
  content,
  filename = 'source.svelte',
  markup,
  options = {},
  attributes,
}) => {
  const basePath = process.cwd();
  const compilerOptions = getCompilerOptions({ filename, options, basePath });

  const sourceMapChain = createSourceMapChain({
    filename,
    content,
    compilerOptions,
  });

  const injectedCode = injectVarsToCode({
    content,
    markup,
    filename,
    attributes,
    sourceMapChain,
  });

  const { transpiledCode, diagnostics } = transpileTs({
    code: injectedCode,
    markup,
    filename,
    basePath,
    options,
    compilerOptions,
    sourceMapChain,
  });

  const code = stripInjectedCode({
    transpiledCode,
    markup,
    filename,
    sourceMapChain,
  });

  const map = await concatSourceMaps({
    filename,
    markup,
    sourceMapChain,
  });

  return {
    code,
    map,
    diagnostics,
  };
};

export { transformer };
