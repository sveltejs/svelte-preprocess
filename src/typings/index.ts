export interface GenericObject {
  [key: string]: unknown;
}

export interface PreprocessResult {
  code: string;
  map?: object | string;
  dependencies?: Array<string>;
}

export interface AttributesObject {
  src?: string;
  type?: string;
  lang?: string;
  [key: string]: string | boolean;
}

export interface PreprocessArgs {
  content: string;
  attributes: AttributesObject;
  filename: string;
}

export type Preprocessor = (
  args: PreprocessArgs,
) => PreprocessResult | Promise<PreprocessResult>;

export interface PreprocessorGroup {
  markup: Preprocessor;
  script: Preprocessor;
  style: Preprocessor;
}
export interface TransformerArgs {
  content: string;
  filename: string;
  map?: string | object;
  dianostics?: Array<unknown>;
  options?: GenericObject;
}

export type Transformer = (
  args: TransformerArgs,
) => PreprocessResult | Promise<PreprocessResult>;

export type TransformerOptions = boolean | GenericObject | Transformer;
