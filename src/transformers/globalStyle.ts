import postcss from 'postcss';

import { globalifySelector } from '../modules/globalifySelector';

import type * as pcss from 'postcss';
import type { Transformer, Options } from '../types';

const selectorPattern = /:global(?!\()/;

const globalifyRulePlugin = (root: pcss.Root) => {
  root.walkRules(selectorPattern, (rule) => {
    const modifiedSelectors = rule.selectors
      .filter((selector) => selector !== ':global')
      .map((selector) => {
        const [beginning, ...rest] = selector.split(selectorPattern);

        if (rest.length === 0) return beginning;

        return [beginning, ...rest.map(globalifySelector)]
          .map((str) => str.trim())
          .join(' ')
          .trim();
      });

    if (modifiedSelectors.length === 0) {
      rule.remove();

      return;
    }

    rule.replaceWith(
      rule.clone({
        selectors: modifiedSelectors,
      }),
    );
  });
};

const globalAttrPlugin = (root: pcss.Root) => {
  root.walkAtRules(/keyframes$/, (atrule) => {
    if (!atrule.params.startsWith('-global-')) {
      atrule.replaceWith(
        atrule.clone({
          params: `-global-${atrule.params}`,
        }),
      );
    }
  });

  root.walkRules((rule) => {
    // we use endsWith for checking @keyframes and prefixed @-{prefix}-keyframes
    if ((rule?.parent as pcss.AtRule)?.name?.endsWith('keyframes')) {
      return;
    }

    rule.replaceWith(
      rule.clone({
        selectors: rule.selectors.map(globalifySelector),
      }),
    );
  });
};

const transformer: Transformer<Options.GlobalStyle> = async ({
  content,
  filename,
  options,
  map,
  attributes,
}) => {
  const plugins = [
    globalifyRulePlugin,
    attributes?.global && globalAttrPlugin,
  ].filter(Boolean);

  const { css, map: newMap } = await postcss(plugins).process(content, {
    from: filename,
    map: options?.sourceMap ? { prev: map } : false,
  });

  return { code: css, map: newMap };
};

export { transformer };
