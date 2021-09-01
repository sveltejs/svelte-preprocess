import { dirname, isAbsolute, join, resolve } from 'path';

import ts from 'typescript';
import { compile } from 'svelte/compiler';
import pkg from 'svelte/package.json';
import MagicString from 'magic-string';
import sorcery from 'sorcery';

import { throwTypescriptError } from '../modules/errors';
import { createTagRegex, parseAttributes, stripTags } from '../modules/markup';
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
  let match: RegExpMatchArray;

  while ((match = regex.exec(markup)) !== null) {
    const { context } = parseAttributes(match[1]);

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

  const sep = '\nconst $$$$$$$$ = null;\n';
  const varnames = vars.map((v) =>
    v.name.startsWith('$') && !v.name.startsWith('$$')
      ? `${v.name},${v.name.slice(1)}`
      : v.name,
  );

  // TODO investigate if it's possible to achieve this with a
  // TS transformer (previous attemps have failed)
  const codestores = Array.from(
    content.match(/\$[^\s();:,[\]{}.?!+-=*/~|&%<>^]+/g) || [],
    (name) => name.slice(1),
  );

  const varsString = [...codestores, ...varnames].join(',');
  const injectedVars = `const $$vars$$ = [${varsString}];`;
  const injectedCode =
    attributes?.context === 'module'
      ? `${sep}${getScriptContent(markup, false)}\n${injectedVars}`
      : `${sep}${getScriptContent(markup, true)}\n${injectedVars}`;

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
  diagnostics: ts.Diagnostic[];
  sourceMapText: string;
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

  if (sourceMapChain) {
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
    transformers: { before: [importTransformer] },
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
  filename = 'source.svelte',
  markup,
  options = {},
  attributes,
}) => {
  const basePath = process.cwd();
  filename = isAbsolute(filename) ? filename : resolve(basePath, filename);
  const compilerOptions = getCompilerOptions({ filename, options, basePath });

  const canUseMixedImportsTranspiler = +pkg.version.split('.')[1] >= 39;
  if (!canUseMixedImportsTranspiler && options.handleMixedImports) {
    throw new Error(
      'You need at least Svelte 3.39 to use the handleMixedImports option',
    );
  }

  const handleMixedImports =
    options.handleMixedImports === false
      ? false
      : options.handleMixedImports || canUseMixedImportsTranspiler;

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
