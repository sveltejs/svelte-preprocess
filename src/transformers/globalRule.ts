import postcss from 'postcss';

import { Transformer, Options } from '../types';
import { globalifySelector } from '../modules/globalifySelector';

const selectorPattern = /:global(?!\()/;

const globalifyRulePlugin: postcss.Transformer = (root) => {
  root.walkRules(selectorPattern, (rule) => {
    const modifiedSelectors = rule.selectors.map((selector) => {
      const [beginning, ...rest] = selector.split(selectorPattern);

      if (rest.length === 0) return;

      return [beginning, ...rest.map(globalifySelector)]
        .map((str) => str.trim())
        .join(' ')
        .trim();
    });

    rule.replaceWith(
      rule.clone({
        selectors: modifiedSelectors,
      }),
    );
  });
};

// todo - this can be merged with the globalStyle
const transformer: Transformer<Options.GlobalRule> = async ({
  content,
  filename,
  options,
}) => {
  const { css, map: newMap } = await postcss()
    .use(globalifyRulePlugin)
    .process(content, {
      from: filename,
      map: options?.sourceMap ?? false,
    });

  return { code: css, map: newMap };
};

export default transformer;
