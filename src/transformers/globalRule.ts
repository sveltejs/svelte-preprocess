import postcss from 'postcss';

import { Transformer } from '../types';
import { globalifySelector } from '../modules/globalifySelector';

const selectorPattern = /:global(?!\()/;

const globalifyRulePlugin = (root: any) => {
  root.walkRules(selectorPattern, (rule: any) => {
    const [beginning, ...rest] = rule.selector.split(selectorPattern);

    rule.selector = [beginning, ...rest.map(globalifySelector)]
      .map((str) => str.trim())
      .join(' ')
      .trim();
  });
};

const transformer: Transformer<never> = async ({ content, filename }) => {
  const { css, map: newMap } = await postcss()
    .use(globalifyRulePlugin)
    .process(content, { from: filename, map: true });

  return { code: css, map: newMap };
};

export default transformer;
