import { Transformer } from '../typings';
import coffeescript from 'coffeescript';

const transformer: Transformer = ({ content, filename, options }) => {
  const { js: code, sourceMap: map } = coffeescript.compile(content, {
    filename,
    sourceMap: true,
    ...options,
  });

  return { code, map };
};

export default transformer;
