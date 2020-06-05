import postcss from 'postcss';

import { Transformer } from '../types';
import { globalifySelector } from '../modules/globalifySelector';

const globalifyPlugin = (root: any) => {
  root.walkAtRules(/keyframes$/, (atrule: any) => {
    if (!atrule.params.startsWith('-global-')) {
      atrule.params = `-global-${atrule.params}`;
    }
  });

  root.walkRules((rule: any) => {
    if (rule.parent && rule.parent.name === 'keyframes') {
      return;
    }

    rule.selectors = rule.selectors.map(globalifySelector);
  });
};

const transformer: Transformer<never> = async ({ content, filename }) => {
  const { css, map: newMap } = await postcss()
    .use(globalifyPlugin)
    .process(content, { from: filename, map: true });

  return { code: css, map: newMap };
};

export default transformer;
