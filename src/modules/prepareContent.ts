// todo: could use magic-string and generate some sourcemaps 🗺
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

/** Get the shortest leading whitespace from lines in a string */
function minIndent(s: string) {
  const match = s.match(/^[ \t]*(?=\S)/gm);

  if (!match) {
    return 0;
  }

  return match.reduce((r, a) => Math.min(r, a.length), Infinity);
}

/** Strip leading whitespace from each line in a string */
function stripIndent(s: string) {
  const indent = minIndent(s);

  if (indent === 0) {
    return s;
  }

  const regex = new RegExp(`^[ \\t]{${indent}}`, 'gm');

  return s.replace(regex, '');
}
