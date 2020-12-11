import pipe, { EventuallyProcessed } from '../pipe';
import { Transformer, Preprocessor } from '../types';

export function transformMarkup<S>(
  sync: S,
  { content, filename }: { content: string; filename: string },
  transformer: Preprocessor | Transformer<unknown>,
  options: Record<string, any> = {},
): EventuallyProcessed<S> {
  let { markupTagName = 'template' } = options;

  markupTagName = markupTagName.toLocaleLowerCase();

  const markupPattern = new RegExp(
    `<${markupTagName}([\\s\\S]*?)(?:>([\\s\\S]*)<\\/${markupTagName}>|/>)`,
  );

  const templateMatch = content.match(markupPattern);

  /** If no <template> was found, run the transformer over the whole thing */
  if (!templateMatch) {
    return transformer({
      content,
      attributes: {},
      filename,
      options,
    }) as EventuallyProcessed<S>;
  }

  const [fullMatch, attributesStr, templateCode] = templateMatch;

  /** Transform an attribute string into a key-value object */
  const attributes = attributesStr
    .split(/\s+/)
    .filter(Boolean)
    .reduce((acc: Record<string, string | boolean>, attr) => {
      const [name, value] = attr.split('=');

      // istanbul ignore next
      acc[name] = value ? value.replace(/['"]/g, '') : true;

      return acc;
    }, {});

  /** Transform the found template code */
  return pipe<S>(
    sync,
    () =>
      transformer({
        content: templateCode,
        attributes,
        filename,
        options,
      }) as EventuallyProcessed<S>,
    ({ code, map, dependencies }) => {
      code =
        content.slice(0, templateMatch.index) +
        code +
        content.slice(templateMatch.index + fullMatch.length);

      return { code, map, dependencies } as EventuallyProcessed<S>;
    },
  );
}
