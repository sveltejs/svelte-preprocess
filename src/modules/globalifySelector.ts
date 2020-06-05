export function globalifySelector(selector: string) {
  return selector
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((selectorPart) => {
      if (selectorPart.startsWith(':local')) {
        return selectorPart.replace(/:local\((.+?)\)/g, '$1');
      }
      if (selectorPart.startsWith(':global')) {
        return selectorPart;
      }

      return `:global(${selectorPart})`;
    })
    .join(' ');
}
