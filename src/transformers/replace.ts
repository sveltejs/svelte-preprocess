import type { Transformer, Options } from '../types';

const transformer: Transformer<Options.Replace> = async ({
  content,
  options,
}) => {
  let newContent = content;

  if (options == null) {
    return { code: content };
  }

  for (const [regex, replacer] of options) {
    newContent = newContent.replace(regex, replacer as any);
  }

  return {
    code: newContent,
  };
};

export { transformer };
