type SveltePreprocessObject = {
  markup: Function,
  script: Function,
  style: Function
}

type PreprocessResult = {
  code: string;
  map?: object;
}

type SveltePreprocessOptions = {
  onBefore?({ content, filename }: { content: string, filename: string }): string;
  languages?: {
    [language: string]: boolean | object | (({ content, filename }: { content: string, filename?: string }) =>
    PreprocessResult | Promise<PreprocessResult>)
  }
}

declare function getSveltePreprocessor(config: SveltePreprocessOptions): SveltePreprocessObject;

declare module "svelte-preprocess" {
  export = getSveltePreprocessor;
}
