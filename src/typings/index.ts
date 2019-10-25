import { Processed, Preprocessor } from 'svelte/types/compiler/preprocess';

export {
  Processed,
  PreprocessorGroup,
  Preprocessor,
} from 'svelte/types/compiler/preprocess';

export type PreprocessorArgs = Preprocessor extends (options: infer T) => any
  ? T
  : never;

export interface TransformerArgs {
  content: string;
  filename: string;
  map?: string | object;
  dianostics?: Array<unknown>;
  options?: Record<string, any>;
}

export type Transformer = (
  args: TransformerArgs,
) => Processed | Promise<Processed>;

export type TransformerOptions = boolean | Record<string, any> | Transformer;
