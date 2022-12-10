import { dirname, isAbsolute, join, resolve } from 'path';

import ts from 'typescript';
import { compile } from 'svelte/compiler';
import MagicString from 'magic-string';
import sorcery from 'sorcery';

import { throwTypescriptError } from '../modules/errors';
import { createTagRegex, parseAttributes, stripTags } from '../modules/markup';
import { JAVASCRIPT_RESERVED_KEYWORD_SET } from '../modules/utils';

import pkg from 'svelte/package.json';

import type { Transformer, Options, TransformerArgs } from '../types';

type CompilerOptions = ts.CompilerOptions;

type SourceMapChain = {
  content: Record<string, string>;
  sourcemaps: Record<string, object>;
};

type InternalTransformerOptions = TransformerArgs<Options.Typescript> & {
  basePath: string;
  compilerOptions: CompilerOptions;
};

const injectedCodeSeparator = 'const $$$$$$$$ = null;';

/**
 * Map of valid tsconfigs (no errors). Key is the path.
 */
const tsconfigMap = new Map<string, any>();

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

function getScriptContent(markup: string, module: boolean): string {
  const regex = createTagRegex('script', 'gi');
  let match: RegExpMatchArray | null;

  while ((match = regex.exec(markup)) !== null) {
    const { context } = parseAttributes(match[1] || '');

    if ((context !== 'module' && !module) || (context === 'module' && module)) {
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

  const sep = `\n${injectedCodeSeparator}\n`;
  const varnames = vars.map((v) =>
    v.name.startsWith('$') && !v.name.startsWith('$$')
      ? `${v.name},${v.name.slice(1)}`
      : v.name,
  );

  const contentForCodestores =
    content +
    // Append instance script content because it's valid
    // to import a store in module script and autosubscribe to it in instance script
    (attributes?.context === 'module' ? getScriptContent(markup, false) : '');

  // This regex extracts all possible store variables
  // TODO investigate if it's possible to achieve this with a
  // TS transformer (previous attemps have failed)
  const codestores = Array.from(
    contentForCodestores.match(
      /\$[^\s();:,[\]{}.?!+\-=*/\\~|&%<>^`"'°§#0-9][^\s();:,[\]{}.?!+\-=*/\\~|&%<>^`"'°§#]*/g,
    ) || [],
    (name) => name.slice(1),
  ).filter((name) => !JAVASCRIPT_RESERVED_KEYWORD_SET.has(name));

  const varsString = [...codestores, ...varnames].join(',');
  const injectedVars = `const $$vars$$ = [${varsString}];`;
  // Append instance/markup script content because it's valid
  // to import things in one and reference it in the other.
  const injectedCode =
    attributes?.context === 'module'
      ? `${sep}${getScriptContent(markup, false)}\n${injectedVars}`
      : `${sep}${getScriptContent(markup, true)}\n${injectedVars}`;

  if (sourceMapChain) {
    const ms = new MagicString(content).append(injectedCode);
    const fname = `${filename}.injected.ts`;
    const code = ms.toString();
    const map = ms.generateMap({
      source: filename,
      file: fname,
      hires: true,
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

  const injectedCodeStart = transpiledCode.indexOf(injectedCodeSeparator);

  if (sourceMapChain) {
    const ms = new MagicString(transpiledCode).snip(0, injectedCodeStart);
    const source = `${filename}.transpiled.js`;
    const file = `${filename}.js`;
    const code = ms.toString();
    const map = ms.generateMap({
      source,
      file,
      hires: true,
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
  const inputOptions = options.compilerOptions ?? {};

  const { errors, options: convertedCompilerOptions } =
    options.tsconfigFile !== false || options.tsconfigDirectory
      ? loadTsconfig(inputOptions, filename, options)
      : ts.convertCompilerOptionsFromJson(inputOptions, basePath);

  if (errors.length) {
    throw new Error(formatDiagnostics(errors, basePath));
  }

  const compilerOptions: CompilerOptions = {
    target: ts.ScriptTarget.ES2015,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    ...(convertedCompilerOptions as CompilerOptions),
    importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Error,
    allowNonTsExtensions: true,
    // Clear outDir since it causes source map issues when the files aren't actually written to disk.
    outDir: undefined,
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
  fileName,
  basePath,
  options,
  compilerOptions,
  transformers,
}: {
  code: string;
  fileName: string;
  basePath: string;
  options: Options.Typescript;
  compilerOptions: CompilerOptions;
  transformers?: ts.CustomTransformers;
}): {
  transpiledCode: string;
  diagnostics: ts.Diagnostic[] | undefined;
  sourceMapText: string | undefined;
} {
  const {
    outputText: transpiledCode,
    sourceMapText,
    diagnostics,
  } = ts.transpileModule(code, {
    fileName,
    compilerOptions,
    reportDiagnostics: options.reportDiagnostics !== false,
    transformers,
  });

  if (diagnostics && diagnostics.length > 0) {
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

  return { transpiledCode, sourceMapText, diagnostics };
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

  if (!tsconfigFile) {
    return { errors: [], options: compilerOptionsJSON };
  }

  tsconfigFile = isAbsolute(tsconfigFile)
    ? tsconfigFile
    : join(basePath, tsconfigFile);

  basePath = dirname(tsconfigFile);

  if (tsconfigMap.has(tsconfigFile)) {
    return {
      errors: [],
      options: tsconfigMap.get(tsconfigFile),
    };
  }

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

  if (errors.length === 0) {
    tsconfigMap.set(tsconfigFile, options);
  }

  return { errors, options };
}

async function mixedImportsTranspiler({
  content,
  filename = 'source.svelte',
  markup,
  options = {},
  attributes,
  compilerOptions,
  basePath,
}: InternalTransformerOptions) {
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

  const { transpiledCode, sourceMapText, diagnostics } = transpileTs({
    code: injectedCode,
    fileName: `${filename}.injected.ts`,
    basePath,
    options,
    compilerOptions,
  });

  if (sourceMapChain && sourceMapText) {
    const fname = `${filename}.transpiled.js`;

    sourceMapChain.content[fname] = transpiledCode;
    sourceMapChain.sourcemaps[fname] = JSON.parse(sourceMapText);
  }

  const code = stripInjectedCode({
    transpiledCode,
    markup,
    filename,
    sourceMapChain,
  });

  // Sorcery tries to load the code/map from disk if it's empty,
  // prevent that because it would try to load inexistent files
  // https://github.com/Rich-Harris/sorcery/issues/167
  if (!code) {
    return { code, diagnostics };
  }

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
}

async function simpleTranspiler({
  content,
  filename = 'source.svelte',
  options = {},
  compilerOptions,
  basePath,
}: InternalTransformerOptions) {
  const { transpiledCode, sourceMapText, diagnostics } = transpileTs({
    code: content,
    // `preserveValueImports` essentially does the same as our import transformer,
    // keeping all imports that are not type imports
    transformers: compilerOptions.preserveValueImports
      ? undefined
      : { before: [importTransformer] },
    fileName: filename,
    basePath,
    options,
    compilerOptions,
  });

  return {
    code: transpiledCode,
    map: sourceMapText,
    diagnostics,
  };
}

const transformer: Transformer<Options.Typescript> = async ({
  content,
  filename,
  markup,
  options = {},
  attributes,
}) => {
  const basePath = process.cwd();

  if (filename == null) return { code: content };

  filename = isAbsolute(filename) ? filename : resolve(basePath, filename);

  const compilerOptions = getCompilerOptions({ filename, options, basePath });
  const versionParts = pkg.version.split('.');
  const canUseMixedImportsTranspiler =
    +versionParts[0] > 3 || (+versionParts[0] === 3 && +versionParts[1] >= 39);

  if (!canUseMixedImportsTranspiler && options.handleMixedImports) {
    throw new Error(
      'You need at least Svelte 3.39 to use the handleMixedImports option',
    );
  }

  const handleMixedImports =
    !compilerOptions.preserveValueImports &&
    (options.handleMixedImports === false
      ? false
      : options.handleMixedImports || canUseMixedImportsTranspiler);

  return handleMixedImports
    ? mixedImportsTranspiler({
        content,
        filename,
        markup,
        options,
        attributes,
        compilerOptions,
        basePath,
      })
    : simpleTranspiler({
        content,
        filename,
        markup,
        options,
        attributes,
        compilerOptions,
        basePath,
      });
};

export { transformer };
