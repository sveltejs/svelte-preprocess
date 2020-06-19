export const throwError = (msg: string) => {
  throw new Error(`[svelte-preprocess] ${msg}`);
};

export const throwUnsupportedError = (lang: string, filename: string) =>
  throwError(`Unsupported script language '${lang}' in file '${filename}'`);

export const throwTypescriptError = () => {
  throwError(`Encountered type error`);
};
