type SveltePreprocessObj = {
  markup: Function,
  script: Function,
  style: Function
}

type PreprocessedObj = {
  code: string;
  map?: object;
}



type MagicSvelteOptions = {
  onBefore?({ content, filename }: { content: string, filename: string }): string;
  languages?: {
    [language: string]: boolean | object | (({ content, filename }: { content: string, filename?: string }) =>
    PreprocessedObj | Promise<PreprocessedObj>)
  }
}

declare function magicalPreprocess(config: MagicSvelteOptions): SveltePreprocessObj;

declare module "svelte-preprocess" {
  export = magicalPreprocess;
}
