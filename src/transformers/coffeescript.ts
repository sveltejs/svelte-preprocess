import coffeescript from 'coffeescript';

import {coffee_label_patch} from '@rmw/coffee-label-patch';
const coffee_label_compile = coffee_label_patch(coffeescript);

import type { Transformer, Options } from '../types';

const transformer: Transformer<Options.Coffeescript> = ({
  content,
  filename,
  options,
}) => {
  const compile = options?.label ? coffee_label_compile : coffeescript.compile.bind(coffeescript);

  const coffeeOptions = {
    filename,
    /*
     * Since `coffeescript` transpiles variables to `var` definitions, it uses a safety mechanism to prevent variables from bleeding to outside contexts. This mechanism consists of wrapping your `coffeescript` code inside an IIFE which, unfortunately, prevents `svelte` from finding your variables. To bypass this behavior, `svelte-preprocess` sets the [`bare` coffeescript compiler option](https://coffeescript.org/#lexical-scope) to `true`.
     */
    bare: true,
    ...options,
  } as Omit<Options.Coffeescript, 'bare'>;

  delete coffeeOptions.label

  if (coffeeOptions.sourceMap) {
    const { js: code, v3SourceMap } = compile(
      content,
      coffeeOptions,
    );

    const map = JSON.parse(v3SourceMap);

    return { code, map };
  }

  return { code: compile(content, coffeeOptions) };
};

export { transformer };
