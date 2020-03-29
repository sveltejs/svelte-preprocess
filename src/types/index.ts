import { Processed, Preprocessor } from 'svelte/types/compiler/preprocess';

import * as Options from './options';

export { Options };

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

export type ProcessedScript = Processed & {
  diagnostics?: unknown[];
};

export type Transformer<T> = (
  args: TransformerArgs<T>,
) => ProcessedScript | Promise<ProcessedScript>;

export type TransformerOptions<T> =
  | boolean
  | Record<string, any>
  | Transformer<T>;
