type SveltePreprocessObj = {
  markup: Function,
  script: Function,
  style: Function
}

type PreprocessedObj = {
  code: string;
  map?: object;
}



type SmartSvelteOptions = {
  onBefore?({ content, filename }: { content: string, filename: string }): string;
  languages?: {
    [language: string]: boolean | object | (({ content, filename }: { content: string, filename?: string }) =>
    PreprocessedObj | Promise<PreprocessedObj>)
  }
}

declare function smartPreprocess(config: SmartSvelteOptions): SveltePreprocessObj;

declare module "svelte-smart-preprocess" {
  export = smartPreprocess;
}
