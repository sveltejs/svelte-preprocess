import postcss from 'postcss';

import { Transformer } from '../types';
import { wrapSelectorInGlobal } from './globalStyle';

const globalifyRulePlugin = (root: any) => {
  root.walkRules(/:global(?!\()/, (rule: any) => {
    const [beginning, ...rest] = rule.selector.split(/:global(?!\()/);
    rule.selector = (
      beginning.trim() + ' '
      + rest.filter((x: string) => !!x).map(wrapSelectorInGlobal).join(' ')
    ).trim();
  });
};

const transformer: Transformer<never> = async ({ content, filename }) => {
  const { css, map: newMap } = await postcss()
    .use(globalifyRulePlugin)
    .process(content, { from: filename, map: true });

  return { code: css, map: newMap };
};

export default transformer;
