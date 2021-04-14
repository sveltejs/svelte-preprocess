import type { Transformer, Preprocessor } from '../types';

/** Create a tag matching regexp. */
export function createTagRegex(tagName: string, flags?: string): RegExp {
  return new RegExp(
    `<!--[^]*?-->|<${tagName}(\\s[^]*?)?(?:>([^]*?)<\\/${tagName}>|\\/>)`,
    flags,
  );
}

/** Strip script and style tags from markup. */
export function stripTags(markup: string): string {
  return markup
    .replace(createTagRegex('style', 'gi'), '')
    .replace(createTagRegex('script', 'gi'), '');
}

/** Transform an attribute string into a key-value object */
export function parseAttributes(attributesStr: string): Record<string, any> {
  return attributesStr
    .split(/\s+/)
    .filter(Boolean)
    .reduce((acc: Record<string, string | boolean>, attr) => {
      const [name, value] = attr.split('=');

      // istanbul ignore next
      acc[name] = value ? value.replace(/['"]/g, '') : true;

      return acc;
    }, {});
}

export async function transformMarkup(
  { content, filename }: { content: string; filename: string },
  transformer: Preprocessor | Transformer<unknown>,
  options: Record<string, any> = {},
) {
  let { markupTagName = 'template' } = options;

  markupTagName = markupTagName.toLocaleLowerCase();

  const markupPattern = createTagRegex(markupTagName);

  const templateMatch = content.match(markupPattern);

  /** If no <template> was found, run the transformer over the whole thing */
  if (!templateMatch) {
    return transformer({
      content,
      markup: content,
      attributes: {},
      filename,
      options,
    });
  }

  const [fullMatch, attributesStr = '', templateCode] = templateMatch;

  const attributes = parseAttributes(attributesStr);

  /** Transform the found template code */
  let { code, map, dependencies } = await transformer({
    content: templateCode,
    markup: templateCode,
    attributes,
    filename,
    options,
  });

  code =
    content.slice(0, templateMatch.index) +
    code +
    content.slice(templateMatch.index + fullMatch.length);

  return { code, map, dependencies };
}
