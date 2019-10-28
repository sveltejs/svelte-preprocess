import postcss from 'postcss';
import { Processed, Preprocessor } from 'svelte/types/compiler/preprocess';
import { Options as SassOptions } from 'sass';
import { Options as PugOptions } from 'pug';
import { CompilerOptions } from 'typescript';

export {
  Processed,
  PreprocessorGroup,
  Preprocessor,
} from 'svelte/types/compiler/preprocess';

export type PreprocessorArgs = Preprocessor extends (options: infer T) => any
  ? T
  : never;

export interface TransformerArgs<T> {
  content: string;
  filename: string;
  map?: string | object;
  dianostics?: Array<unknown>;
  options?: T;
}

export type Transformer<T> = (
  args: TransformerArgs<T>,
) => Processed | Promise<Processed>;

export type TransformerOptions<T> =
  | boolean
  | Record<string, any>
  | Transformer<T>;

export namespace Options {
  export interface Coffeescript {
    inlineMap?: boolean;
    filename?: string;
    bare?: boolean;
    header?: boolean;
    transpile?: any;
  }

  export interface Postcss extends postcss.ProcessOptions {
    plugins: postcss.AcceptedPlugin[];
    configFilePath?: string;
  }

  export type Pug = PugOptions;
  export type Sass = Omit<SassOptions, 'file'>;
  // from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/less/index.d.ts#L80
  export interface Less {
    paths?: string[];
    plugins?: any[];
    strictImports?: boolean;
    maxLineLen?: number;
    dumpLineNumbers?: 'comment' | string;
    silent?: boolean;
    strictUnits?: boolean;
    globalVars?: Record<string, string>;
    modifyVars?: Record<string, string>;
  }

  // from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/stylus/index.d.ts#L1410
  export interface Stylus {
    globals?: Record<string, any>;
    functions?: Record<string, any>;
    imports?: string[];
    paths?: string[];
    // custom
    sourcemap?: boolean;
  }

  export interface Typescript {
    compilerOptions: CompilerOptions & { transpileOnly?: boolean };
    tsconfigFile?: string | boolean;
    tsconfigDirectory?: string | boolean;
    transpileOnly?: boolean;
    reportDiagnostics?: boolean;
  }
}
