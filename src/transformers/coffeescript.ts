import coffeescript from 'coffeescript';

import { Transformer, Options } from '../typings';

const transformer: Transformer<Options.Coffeescript> = ({
  content,
  filename,
  options,
}) => {
  const { js: code, sourceMap: map } = coffeescript.compile(content, {
    filename,
    sourceMap: true,
    ...options,
  });

  return { code, map };
};

export default transformer;
