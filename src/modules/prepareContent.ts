import stripIndent from 'strip-indent';

export function prepareContent({
  options,
  content,
}: {
  options: any;
  content: string;
}) {
  if (typeof options !== 'object') {
    return content;
  }

  content = stripIndent(content);

  if (options.prependData) {
    content = `${options.prependData}\n${content}`;
  }

  return content;
}
