import stripIndent from 'strip-indent';

import { ContentModifier } from '../types/options';

export function prepareContent({
  options,
  content,
  filename,
}: {
  options: ContentModifier & unknown;
  content: string;
  filename: string;
}) {
  if (typeof options !== 'object') {
    return content;
  }

  content = stripIndent(content);

  if (options.prependData) {
    console.warn(
      '[svelte-preprocess] 🙊 `options.prependData` is deprecated. Use `options.additionalData` instead.',
    );

    if (!options.additionalData) {
      content = `${options.prependData}\n${content}`;
    }
  }

  if (options.additionalData) {
    if (typeof options.additionalData === 'function') {
      content = options.additionalData({ content, filename });
    } else {
      content = `${options.prependData}\n${content}`;
    }
  }

  return content;
}
