/* eslint-disable @typescript-eslint/naming-convention */
import { Transformer, Options } from '../types';

const transformer: Transformer<Options.Replace> = ({ content, options }) => {
  let newContent = content;

  for (const [regex, replacer] of options) {
    newContent = newContent.replace(regex, replacer as any);
  }

  return {
    code: newContent,
  };
};

const is_sync = true;

export { transformer, is_sync };
