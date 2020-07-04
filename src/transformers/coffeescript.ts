import coffeescript from 'coffeescript';

import { Transformer, Options } from '../types';

const transformer: Transformer<Options.Coffeescript> = ({
  content,
  filename,
  options,
}) => {
  const coffeeOptions = {
    filename,
    bare: true,
    ...options,
  };

  if (coffeeOptions.sourceMap) {
    const { js: code, sourceMap: map } = coffeescript.compile(
      content,
      coffeeOptions,
    );

    return { code, map };
  }

  const code = coffeescript.compile(content, coffeeOptions);

  return { code };
};

export { transformer };
