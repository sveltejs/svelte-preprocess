const combinatorPattern = /(\s*[ >+~,]\s*)(?![^[]+\])/g;

export function globalifySelector(selector: string) {
  return selector
    .trim()
    .split(combinatorPattern)
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
}
