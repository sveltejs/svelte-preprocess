import stripIndent from 'strip-indent';

import { Transformer, TransformerArgs, TransformerOptions } from '../types';
import { throwError } from './errors';

const TRANSFORMERS = {} as {
  [key: string]: Transformer<any>;
};

export const runTransformer = async (
  name: string,
  options: TransformerOptions,
  { content, map, filename, attributes }: TransformerArgs<any>,
): Promise<ReturnType<Transformer<unknown>>> => {
  // remove any unnecessary indentation (useful for coffee, pug and sugarss)
  content = stripIndent(content);

  if (typeof options === 'function') {
    return options({ content, map, filename, attributes });
  }

  try {
    if (!TRANSFORMERS[name]) {
      await import(`../transformers/${name}`).then((mod) => {
        // istanbul ignore else
        TRANSFORMERS[name] = mod.default;
      });
    }

    return TRANSFORMERS[name]({
      content,
      filename,
      map,
      attributes,
      options: typeof options === 'boolean' ? null : options,
    });
  } catch (e) {
    throwError(
      `Error transforming '${name}'.\n\nMessage:\n${e.message}\n\nStack:\n${e.stack}`,
    );
  }
};
