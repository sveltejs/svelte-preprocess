import postcss from 'postcss';

import { Transformer } from '../types';

const globalifyPlugin = (root: any) => {
  root.walkAtRules(/keyframes$/, (atrule: any) => {
    if (!atrule.params.startsWith('-global-')) {
      atrule.params = '-global-' + atrule.params;
    }
  });

  root.walkRules((rule: any) => {
    if (rule.parent && rule.parent.name === 'keyframes') {
      return;
    }

    rule.selectors = rule.selectors.map((selector: string) => {
      return selector
        .split(' ')
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
    });
  });
};

const transformer: Transformer<never> = async ({ content, filename }) => {
  const { css, map: newMap } = await postcss()
    .use(globalifyPlugin)
    .process(content, { from: filename, map: true });

  return { code: css, map: newMap };
};

export default transformer;
