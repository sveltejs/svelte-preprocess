/*
 * Split a selector string (ex: div > foo ~ .potato) by
 * separators: space, >, +, ~ and comma (maybe not needed)
 * We use a negative lookbehind assertion to prevent matching
 * escaped combinators like `\~`.
 */
// TODO: maybe replace this ugly pattern with an actual selector parser? (https://github.com/leaverou/parsel, 2kb)
const combinatorPattern = /(?<!\\)(?:\\\\)*([ >+~,]\s*)(?![^[]+\]|\d)/g;

export function globalifySelector(selector: string) {
  const parts = selector.trim().split(combinatorPattern);

  const modifiedSelector = parts
    .map((selectorPart: string, index: number) => {
      // if this is the separator
      if (index % 2 !== 0) {
        return selectorPart;
      }

      if (selectorPart === '') {
        return selectorPart;
      }

      if (selectorPart.startsWith(':local')) {
        return selectorPart.replace(/:local\((.+?)\)/g, '$1');
      }

      if (selectorPart.startsWith(':global')) {
        return selectorPart;
      }

      return `:global(${selectorPart})`;
    })
    .join('');

  return modifiedSelector;
}
