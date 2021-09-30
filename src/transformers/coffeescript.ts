import coffeescript from 'coffeescript';

import type { Transformer, Options } from '../types';

const transformer: Transformer<Options.Coffeescript> = ({
  content,
  filename,
  options,
}) => {
  const coffeeOptions = {
    filename,
    /*
     * Since `coffeescript` transpiles variables to `var` definitions, it uses a safety mechanism to prevent variables from bleeding to outside contexts. This mechanism consists of wrapping your `coffeescript` code inside an IIFE which, unfortunately, prevents `svelte` from finding your variables. To bypass this behavior, `svelte-preprocess` sets the [`bare` coffeescript compiler option](https://coffeescript.org/#lexical-scope) to `true`.
     */
    bare: true,
    ...options,
  } as Omit<Options.Coffeescript, 'bare'>;

  if (coffeeOptions.sourceMap) {
    const { js: code, v3SourceMap } = coffeescript.compile(
      content,
      coffeeOptions,
    );

    const map = JSON.parse(v3SourceMap);

    return { code, map };
  }

  return { code: coffeescript.compile(content, coffeeOptions) };
};

export { transformer };
