import postcss, { AtRule } from 'postcss';

import { Transformer, Options } from '../types';
import { globalifySelector } from '../modules/globalifySelector';

const globalifyPlugin = (root: postcss.Root) => {
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
    if ((rule?.parent as AtRule)?.name === 'keyframes') {
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
}) => {
  const { css, map: newMap } = await postcss()
    .use(globalifyPlugin)
    .process(content, {
      from: filename,
      map: options?.sourceMap ?? false,
    });

  return { code: css, map: newMap };
};

export default transformer;
