import coffeescript from 'coffeescript';

import { Transformer, Options } from '../types';

const transformer: Transformer<Options.Coffeescript> = ({
  content,
  filename,
  options,
}) => {
  const { js: code, sourceMap: map } = coffeescript.compile(content, {
    filename,
    sourceMap: true,
    bare: true,
    ...options,
  });

  return { code, map };
};

export default transformer;
