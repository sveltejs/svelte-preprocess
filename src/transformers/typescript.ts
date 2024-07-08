import { dirname, isAbsolute, join, resolve } from 'path';
import ts from 'typescript';
import { throwTypescriptError } from '../modules/errors';
import type { Transformer, Options } from '../types';

type CompilerOptions = ts.CompilerOptions;

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

let warned_verbatim = false;

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
    ...convertedCompilerOptions,
    // force module(resolution) to esnext and a compatible moduleResolution. Reason:
    // transpileModule treats NodeNext as CommonJS because it doesn't read the package.json.
    // Also see https://github.com/microsoft/TypeScript/issues/53022 (the filename workaround doesn't work).
    module: ts.ModuleKind.ESNext,
    moduleResolution:
      convertedCompilerOptions.moduleResolution ===
      ts.ModuleResolutionKind.Bundler
        ? ts.ModuleResolutionKind.Bundler
        : ts.ModuleResolutionKind.Node10,
    customConditions: undefined, // fails when using an invalid moduleResolution combination which could happen when we force moduleResolution to Node10
    allowNonTsExtensions: true,
    // Clear outDir since it causes source map issues when the files aren't actually written to disk.
    outDir: undefined,
  };

  if (!warned_verbatim && !compilerOptions.verbatimModuleSyntax) {
    warned_verbatim = true;
    console.warn(
      'The TypeScript option verbatimModuleSyntax is now required when using Svelte files with lang="ts". Please add it to your tsconfig.json.',
    );
  }

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

    if (hasError) {
      const formattedDiagnostics = formatDiagnostics(diagnostics, basePath);

      console.log(formattedDiagnostics);
      throwTypescriptError();
    }
  }

  return { transpiledCode, sourceMapText, diagnostics };
}

export function loadTsconfig(
  compilerOptionsJSON: any,
  filename: string,
  tsOptions: Options.Typescript,
): {
  options: ts.CompilerOptions;
  errors: ts.Diagnostic[];
} {
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

let warned_mixed = false;

const transformer: Transformer<Options.Typescript> = async ({
  content,
  filename = 'input.svelte',
  options = {},
}) => {
  const basePath = process.cwd();

  filename = isAbsolute(filename) ? filename : resolve(basePath, filename);

  const compilerOptions = getCompilerOptions({ filename, options, basePath });

  if ('handleMixedImports' in options && !warned_mixed) {
    warned_mixed = true;
    console.warn(
      'The svelte-preprocess TypeScript option handleMixedImports was removed. Use the verbatimModuleSyntax TypeScript option instead.',
    );
  }

  const { transpiledCode, sourceMapText, diagnostics } = transpileTs({
    code: content,
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
};

export { transformer };
