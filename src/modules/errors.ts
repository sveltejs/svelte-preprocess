export const throwError = (msg: string) => {
  throw new Error(`[svelte-preprocess] ${msg}`);
};

export const throwTypescriptError = () => {
  throwError(`Encountered type error`);
};
