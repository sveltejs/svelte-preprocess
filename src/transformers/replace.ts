import remapping from '@ampproject/remapping';
import MagicString from 'magic-string';
import type { Transformer, Options } from '../types';

type ReplacementMatch = {
  match: string;
  captures: unknown[];
  offset: number;
  input: string;
  groups?: Record<string, string>;
};

function substitute(
  replacement: string,
  { match, captures, offset, input, groups }: ReplacementMatch,
): string {
  return replacement.replace(
    /\$(\$|&|`|'|[0-9]{1,2}|<[^>]*>)/g,
    (token, key: string) => {
      if (key === '$') return '$';
      if (key === '&') return match;
      if (key === '`') return input.slice(0, offset);
      if (key === "'") return input.slice(offset + match.length);
      if (key[0] === '<') {
        return groups == null ? token : groups[key.slice(1, -1)] ?? '';
      }

      let capture = Number(key);

      if (capture === 0) return token;
      if (capture > captures.length && key.length === 2) {
        capture = Number(key[0]);
        if (capture > 0 && capture <= captures.length) {
          return String(captures[capture - 1] ?? '') + key[1];
        }
      }

      return capture <= captures.length
        ? String(captures[capture - 1] ?? '')
        : token;
    },
  );
}

const transformer: Transformer<Options.Replace> = async ({
  content,
  options,
  filename,
}) => {
  let newContent = content;

  if (options == null) {
    return { code: content };
  }

  const maps: string[] = [];

  for (const [search, replacer] of options) {
    const magicString = new MagicString(newContent);
    let changed = false;
    const input = newContent;

    // Let String.replace determine matches and callback arguments. Applying the
    // same edits to MagicString keeps the output and its map in sync.
    newContent = input.replace(search, (match, ...args: unknown[]) => {
      const hasGroups = typeof args[args.length - 1] === 'object';
      const offsetIndex = args.length - (hasGroups ? 3 : 2);
      const offset = args[offsetIndex] as number;
      const captures = args.slice(0, offsetIndex);
      const groups = hasGroups
        ? (args[args.length - 1] as Record<string, string>)
        : undefined;

      const value =
        typeof replacer === 'function'
          ? String(
              (replacer as (...args: unknown[]) => unknown)(match, ...args),
            )
          : substitute(String(replacer), {
              match,
              captures,
              offset,
              input,
              groups,
            });

      if (value !== match) {
        changed = true;
        if (match.length === 0) magicString.appendLeft(offset, value);
        else magicString.overwrite(offset, offset + match.length, value);
      }

      return value;
    });

    if (changed) {
      maps.unshift(
        magicString
          .generateMap({
            source: filename ?? 'input.svelte',
            includeContent: true,
            hires: true,
          })
          .toString(),
      );
    }
  }

  return {
    code: newContent,
    map: maps.length ? remapping(maps, () => null) : undefined,
  };
};

export { transformer };
