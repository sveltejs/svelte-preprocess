import type { LegacyStringOptions } from 'sass';
import type * as postcss from 'postcss';
import type { Options as PugOptions } from 'pug';
import type { TransformOptions as BabelOptions } from '@babel/core';

type ContentModifier = {
  prependData?: string;
  stripIndent?: boolean;
};

type MarkupOptions = {
  markupTagName?: string;
};

export type Coffeescript = {
  sourceMap?: boolean;
  filename?: never;
  bare?: never;
} & ContentModifier;

export type Postcss = postcss.ProcessOptions & {
  plugins?: postcss.AcceptedPlugin[];
  // custom
  configFilePath?: string;
} & ContentModifier;

export type Babel = BabelOptions & {
  sourceType?: 'module';
  minified?: false;
  ast?: false;
  code?: true;
  sourceMaps?: boolean;
} & ContentModifier;

export type Pug = Omit<PugOptions, 'filename' | 'doctype' | 'compileDebug'> &
  ContentModifier &
  MarkupOptions;

export type Sass = Omit<LegacyStringOptions<'sync'>, 'file' | 'data'> &
  ContentModifier;

// from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/less/index.d.ts#L80
export type Less = {
  paths?: string[];
  plugins?: any[];
  strictImports?: boolean;
  maxLineLen?: number;
  dumpLineNumbers?: 'comment' | string;
  silent?: boolean;
  strictUnits?: boolean;
  globalVars?: Record<string, string>;
  modifyVars?: Record<string, string>;
} & ContentModifier;

// from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/stylus/index.d.ts#L1410
export type Stylus = {
  globals?: Record<string, any>;
  functions?: Record<string, any>;
  imports?: string[];
  paths?: string[];
  // custom
  sourcemap?: boolean;
} & ContentModifier;

export type Typescript = {
  compilerOptions?: any;
  // custom
  tsconfigFile?: string | boolean;
  tsconfigDirectory?: string | boolean;
  reportDiagnostics?: boolean;
  handleMixedImports?: boolean;
} & ContentModifier;

export interface GlobalStyle {
  sourceMap: boolean;
}

export type Replace = Array<
  | [string | RegExp, string]
  | [RegExp, (substring: string, ...args: any[]) => string]
>;
