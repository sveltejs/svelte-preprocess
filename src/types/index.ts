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

export interface TransformerArgs<T> {
  content: string;
  filename: string;
  attributes?: Record<string, any>;
  map?: string | object;
  dianostics?: unknown[];
  options?: T;
}

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
