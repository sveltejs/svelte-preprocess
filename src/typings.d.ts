declare module 'svelte/package.json';
declare module 'coffeescript';
declare module 'less'

interface GenericObject {
  [key: string]: unknown;
}

interface PreprocessResult {
  code: string;
  map?: object | string;
  dependencies?: Array<string>;
}

interface AttributesObject {
  [key: string]: string | boolean;
}

interface PreprocessArgs {
  content: string;
  attributes: AttributesObject;
  filename: string;
}

type Preprocessor = (
  args: PreprocessArgs,
) => PreprocessResult | Promise<PreprocessResult>;

interface PreprocessorGroup {
  markup: Preprocessor;
  script: Preprocessor;
  style: Preprocessor;
}
interface TransformerArgs {
  content: string;
  filename: string;
  map?: string | object;
  dianostics?: Array<unknown>;
  options?: GenericObject;
}

type Transformer = (
  args: TransformerArgs,
) => PreprocessResult | Promise<PreprocessResult>;

type TransformerOptions = boolean | GenericObject | Transformer;

interface TransformersOptions {
  [languageName: string]: TransformerOptions;
}

interface MarkupPreprocessArgs {
  content: string;
  filename: string;
}

type AutoPreprocessOptions = TransformersOptions & {
  onBefore?: (args: MarkupPreprocessArgs) => string;
  markupTagName?: string;
  transformers?: TransformersOptions;
  aliases: Array<[string, string]>;
  preserve: Array<string>;
};
