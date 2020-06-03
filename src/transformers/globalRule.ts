import postcss from 'postcss';

import { Transformer } from '../types';
import { globalifyPlugin } from './globalStyle';

const globalifyRulePlugin = (root: any) => {
  root.walkAtRules(/^global$/, (atrule: any) => {
    globalifyPlugin(atrule);
    let after = atrule;

    atrule.each(function (child: any) {
      after.after(child);
      after = child;
    });

    atrule.remove();
  });
};

const transformer: Transformer<never> = async ({ content, filename }) => {
  const { css, map: newMap } = await postcss()
    .use(globalifyRulePlugin)
    .process(content, { from: filename, map: true });

  return { code: css, map: newMap };
};

export default transformer;
