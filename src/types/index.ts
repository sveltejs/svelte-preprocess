import {
  Processed as SvelteProcessed,
  Preprocessor,
} from 'svelte/types/compiler/preprocess';

import * as Options from './options';

export { Options };

export {
  Processed as SvelteProcessed,
  PreprocessorGroup,
  Preprocessor,
} from 'svelte/types/compiler/preprocess';

export type PreprocessorArgs = Preprocessor extends (options: infer T) => any
  ? T
  : never;

export type TransformerArgs<T> = {
  content: string;
  filename: string;
  attributes?: Record<string, any>;
  map?: string | object;
  dianostics?: unknown[];
  options?: T;
};

export type Processed = SvelteProcessed & {
  diagnostics?: any[];
};

export type Transformer<T> = (
  args: TransformerArgs<T>,
) => Processed | Promise<Processed>;

export type TransformerOptions<T = any> =
  | boolean
  | Record<keyof T | string, T[keyof T] | any>
  | Transformer<T>;

export interface Transformers {
  typescript?: TransformerOptions<Options.Typescript>;
  scss?: TransformerOptions<Options.Sass>;
  sass?: TransformerOptions<Options.Sass>;
  less?: TransformerOptions<Options.Less>;
  stylus?: TransformerOptions<Options.Stylus>;
  postcss?: TransformerOptions<Options.Postcss>;
  coffeescript?: TransformerOptions<Options.Coffeescript>;
  pug?: TransformerOptions<Options.Pug>;
  globalStyle?: Options.GlobalStyle;
  replace?: Options.Replace;
  [language: string]: TransformerOptions;
}
