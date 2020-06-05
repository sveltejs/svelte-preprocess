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
  | Record<string, any>
  | Transformer<T>;
