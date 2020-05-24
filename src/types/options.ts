import postcss from 'postcss';
import { Options as SassOptions } from 'sass';
import { Options as PugOptions } from 'pug';
import { CompilerOptions } from 'typescript';
import { TransformOptions as BabelOptions } from '@babel/core';

export type Replace = Array<
  [RegExp, (substring: string, ...args: any[]) => string | string]
>;

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

export interface Babel extends BabelOptions {
  sourceType?: 'module';
  minified?: false;
  ast?: false;
  code?: true;
  sourceMaps?: boolean;
}

export type Pug = PugOptions;
export type Sass = Omit<SassOptions, 'file'> & { renderSync?: boolean };
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
  compilerOptions?: CompilerOptions & { transpileOnly?: boolean };
  tsconfigFile?: string | boolean;
  tsconfigDirectory?: string | boolean;
  transpileOnly?: boolean;
  reportDiagnostics?: boolean;
  removeNonEmittingImports?: boolean;
}
