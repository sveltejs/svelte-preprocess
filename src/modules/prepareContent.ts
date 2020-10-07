import stripIndent from 'strip-indent';

// todo: could use magig-string and generate some sourcemaps 🗺
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

  if (options.stripIndent) {
    content = stripIndent(content);
  }

  if (options.prependData) {
    content = `${options.prependData}\n${content}`;
  }

  return content;
}
